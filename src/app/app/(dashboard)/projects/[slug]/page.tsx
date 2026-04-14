import { notFound } from 'next/navigation';
import { ProjectChatSection } from '@/features/chat/ProjectChatSection';
import { PlanTasksPanel } from '@/features/projects/PlanTasksPanel';
import { ProjectBitrixSetupPanel } from '@/features/projects/ProjectBitrixSetupPanel';
import { getProjectForUser } from '@/features/projects/project-queries';
import { DEFAULT_PLAN, parsePlanFromJson, type PlanPayload } from '@/shared/domain/plan';
import { getEffectiveChatModel } from '@/shared/lib/openai-model';
import { prisma } from '@/shared/lib/prisma';
import { requireActiveUserId } from '@/shared/lib/session';

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
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <header className="flex min-w-0 shrink-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <h1 className="min-w-0 max-w-full truncate text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          {project.name}
        </h1>
        <ProjectBitrixSetupPanel
          activePhaseId={activePhaseId}
          exportMd={exportMd}
          exportYaml={exportYaml}
          project={project}
        />
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-[minmax(220px,280px)_minmax(0,1fr)] lg:gap-4 lg:overflow-hidden lg:-mx-6">
        <aside className="order-2 flex min-h-0 flex-col overflow-hidden lg:order-1 lg:pl-6">
          <div className="min-h-0 flex-1 overflow-hidden">
            <PlanTasksPanel plan={plan} />
          </div>
        </aside>

        <section className="order-1 flex min-h-[min(60vh,520px)] flex-col lg:order-2 lg:h-full lg:min-h-0 lg:pr-6">
          <ProjectChatSection
            activeModel={effectiveChatModel}
            initialMessages={chatLines}
            phases={phases}
            phaseId={activePhaseId}
            projectId={project.id}
            projectSlug={project.slug}
          />
        </section>
      </div>
    </div>
  );
}
