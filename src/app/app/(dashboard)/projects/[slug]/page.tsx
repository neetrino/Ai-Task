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
import { buildPhaseRailOrder } from '@/features/phases/phase-rail-order';
import { ProjectPlanMeta } from '@/features/projects/ProjectPlanMeta';
import { ProjectRailQuickActions } from '@/features/projects/ProjectRailQuickActions';
import { ProjectWorkspaceRailBranding } from '@/features/projects/ProjectWorkspaceRailBranding';
import { getProjectForUser, listProjectsForUser } from '@/features/projects/project-queries';
import { DEFAULT_PLAN, parsePlanFromJson, type PlanPayload } from '@/shared/domain/plan';
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
  const [project, projectList] = await Promise.all([
    getProjectForUser(slug, userId),
    listProjectsForUser(userId),
  ]);
  if (!project) {
    notFound();
  }

  const projectOptions = projectList.map((p) => ({ slug: p.slug, name: p.name }));

  const phases = await prisma.phase.findMany({
    where: { projectId: project.id },
    orderBy: { lastUsedAt: 'desc' },
  });

  const phaseRail = buildPhaseRailOrder(project.mainLastUsedAt, phases);

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

  const chatLines = messages.map((m) => ({
    id: m.id,
    role: m.role,
    content: m.content,
    attachments: m.attachments,
    modelId: m.modelId,
    contextProfile: m.contextProfile,
    tokensUsed: m.tokensUsed,
  }));

  const taskCounts = await getCachedPhaseTaskCounts(project.id, phases);

  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <ProjectPlanTasksHost
        activePhaseId={activePhaseId}
        initialPlan={plan}
        projectId={project.id}
        projectSlug={project.slug}
      >
        <div className={PROJECT_TASKS_CHAT_GRID_CLASS}>
          <aside className="order-2 flex min-h-0 flex-1 flex-col overflow-hidden bg-workspace-rail pt-0 lg:order-1 lg:border-r lg:border-workspace-hairline lg:px-5">
            <ProjectWorkspaceRailBranding />
            <ProjectPlanMeta
              activeSlug={project.slug}
              plan={plan}
              projectName={project.name}
              projects={projectOptions}
            />
            <PhaseSidebarNav
              activePhaseId={activePhaseId}
              phaseRail={phaseRail}
              projectId={project.id}
              projectSlug={project.slug}
              taskCounts={taskCounts}
            />
            <div className="shrink-0 border-t border-workspace-hairline px-2 py-3">
              <ProjectRailQuickActions
                activePhaseId={activePhaseId}
                bitrixProject={{
                  id: project.id,
                  openaiChatModel: project.openaiChatModel,
                  bitrixProjectId: project.bitrixProjectId,
                  taskOwnerId: project.taskOwnerId,
                  taskAssigneeId: project.taskAssigneeId,
                }}
                plan={plan}
                projectName={project.name}
                projectSlug={project.slug}
              />
            </div>
          </aside>

          <section className="order-1 flex min-h-0 flex-1 flex-col lg:order-2 lg:h-full lg:min-h-0 lg:pr-6">
            <ProjectChatSection
              initialMessages={chatLines}
              modelPreset={project.modelPreset}
              phaseId={activePhaseId}
              pinnedModelId={project.pinnedModelId}
              projectId={project.id}
              projectSlug={project.slug}
            />
          </section>
        </div>
      </ProjectPlanTasksHost>
    </div>
  );
}
