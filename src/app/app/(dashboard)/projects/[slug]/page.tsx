import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChatComposer } from '@/features/chat/ChatComposer';
import { ProjectChatWorkspace } from '@/features/chat/ProjectChatWorkspace';
import { PhasePills } from '@/features/phases/PhasePills';
import { PlanTasksPanel } from '@/features/projects/PlanTasksPanel';
import { ProjectSettingsAside } from '@/features/projects/ProjectSettingsAside';
import { getProjectForUser } from '@/features/projects/project-queries';
import { DEFAULT_PLAN, parsePlanFromJson, type PlanPayload } from '@/shared/domain/plan';
import { getEffectiveChatModel } from '@/shared/lib/openai-model';
import { prisma } from '@/shared/lib/prisma';
import { requireActiveUserId } from '@/shared/lib/session';
import { WORKSPACE_BODY_CLASS, WORKSPACE_LINK_CLASS, WORKSPACE_PANEL_CLASS } from '@/shared/ui/workspace-ui';

function resolvePlanPayload(snapshotPayload: unknown | null): PlanPayload {
  if (!snapshotPayload) return DEFAULT_PLAN;
  try {
    return parsePlanFromJson(snapshotPayload);
  } catch {
    return DEFAULT_PLAN;
  }
}

export default async function ProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ phase?: string }>;
}) {
  const { slug } = await params;
  const { phase: phaseParam } = await searchParams;
  const userId = await requireActiveUserId();
  const project = await getProjectForUser(slug, userId);
  if (!project) {
    notFound();
  }

  const phases = await prisma.phase.findMany({
    where: { projectId: project.id },
    orderBy: { sortOrder: 'asc' },
  });

  let activePhaseId: string | null = null;
  if (phaseParam) {
    const match = phases.find((p) => p.id === phaseParam);
    if (match) {
      activePhaseId = match.id;
    }
  }

  const [messages, snapshot] = await Promise.all([
    prisma.message.findMany({
      where: { projectId: project.id, phaseId: activePhaseId },
      orderBy: { createdAt: 'asc' },
      take: 100,
    }),
    prisma.planSnapshot.findFirst({
      where: { projectId: project.id, phaseId: activePhaseId },
      orderBy: { updatedAt: 'desc' },
    }),
  ]);

  const plan = resolvePlanPayload(snapshot?.payload ?? null);
  const effectiveChatModel = getEffectiveChatModel(project);

  const exportMd = activePhaseId
    ? `/api/projects/${project.slug}/export?format=md&phase=${activePhaseId}`
    : `/api/projects/${project.slug}/export?format=md`;
  const exportYaml = activePhaseId
    ? `/api/projects/${project.slug}/export?format=yaml&phase=${activePhaseId}`
    : `/api/projects/${project.slug}/export?format=yaml`;

  const chatLines = messages.map((m) => ({
    id: m.id,
    role: m.role,
    content: m.content,
  }));

  return (
    <div className="flex min-h-0 flex-col gap-4">
      <header className="flex shrink-0 flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link className={WORKSPACE_LINK_CLASS} href="/app">
            ← All projects
          </Link>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-white sm:text-2xl">
            {project.name}
          </h1>
        </div>
        <p className={`max-w-xl ${WORKSPACE_BODY_CLASS} text-xs sm:text-sm`}>
          Center: chat. Left: AI plan tasks. Right: one-time setup (model, Bitrix, export).
        </p>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:h-[calc(100vh-9.5rem)] lg:grid-cols-[minmax(240px,280px)_minmax(0,1fr)_minmax(260px,300px)] lg:gap-5 lg:overflow-hidden">
        <aside className="order-2 flex min-h-0 flex-col gap-3 overflow-hidden lg:order-1">
          <div className={`shrink-0 p-4 ${WORKSPACE_PANEL_CLASS}`}>
            <PhasePills activePhaseId={activePhaseId} phases={phases} projectSlug={project.slug} />
          </div>
          <div className="min-h-0 flex-1 overflow-hidden">
            <PlanTasksPanel plan={plan} />
          </div>
        </aside>

        <section className="order-1 flex min-h-[min(60vh,520px)] flex-col lg:order-2 lg:h-full lg:min-h-0">
          <ProjectChatWorkspace
            composer={
              <ChatComposer
                activeModel={effectiveChatModel}
                phaseId={activePhaseId}
                projectId={project.id}
              />
            }
            messages={chatLines}
          />
        </section>

        <div className="order-3 min-h-0 lg:overflow-hidden">
          <ProjectSettingsAside
            activePhaseId={activePhaseId}
            exportMd={exportMd}
            exportYaml={exportYaml}
            plan={plan}
            project={project}
          />
        </div>
      </div>
    </div>
  );
}
