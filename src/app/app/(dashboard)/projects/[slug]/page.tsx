import { notFound } from 'next/navigation';
import { ProjectChatSection } from '@/features/chat/ProjectChatSection';
import { PhaseSidebarNav } from '@/features/phases/PhaseSidebarNav';
import {
  getCachedPhaseMessages,
  getCachedPhaseTaskCounts,
  getCachedPlanSnapshot,
} from '@/features/projects/cached-project-loaders';
import { PROJECT_TASKS_CHAT_GRID_CLASS } from '@/features/projects/plan-tasks-layout';
import { ProjectPlanTasksHost } from '@/features/projects/ProjectPlanTasksHost';
import { ProjectPlanMeta } from '@/features/projects/ProjectPlanMeta';
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
    getCachedPhaseMessages(project.id, activePhaseId),
    getCachedPlanSnapshot(project.id, activePhaseId),
  ]);

  const plan = resolvePlanPayload(snapshot?.payload ?? null);
  const effectiveChatModel = getEffectiveChatModel(project);

  const chatLines = messages.map((m) => ({
    id: m.id,
    role: m.role,
    content: m.content,
  }));

  const taskCounts = await getCachedPhaseTaskCounts(project.id, phases);

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-2 overflow-hidden">
      <div className="shrink-0">
        <ProjectBitrixSetupPanel activePhaseId={activePhaseId} layout="edge" project={project} />
      </div>

      <ProjectPlanTasksHost
        activePhaseId={activePhaseId}
        initialPlan={plan}
        projectId={project.id}
        projectSlug={project.slug}
      >
        <div className={PROJECT_TASKS_CHAT_GRID_CLASS}>
          <aside className="order-2 flex min-h-0 flex-1 flex-col overflow-hidden lg:order-1 lg:border-r lg:border-white/10 lg:pl-6">
            <ProjectPlanMeta plan={plan} projectName={project.name} />
            <PhaseSidebarNav
              activePhaseId={activePhaseId}
              phases={phases}
              projectId={project.id}
              projectSlug={project.slug}
              taskCounts={taskCounts}
            />
          </aside>

          <section className="order-1 flex min-h-0 flex-1 flex-col lg:order-2 lg:h-full lg:min-h-0 lg:pr-6">
            <ProjectChatSection
              activeModel={effectiveChatModel}
              initialMessages={chatLines}
              phaseId={activePhaseId}
              projectId={project.id}
            />
          </section>
        </div>
      </ProjectPlanTasksHost>
    </div>
  );
}
