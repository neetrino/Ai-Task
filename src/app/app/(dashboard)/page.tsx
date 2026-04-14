import { WorkspaceProjectsSection } from '@/features/projects/WorkspaceProjectsSection';
import { listProjectsForUser } from '@/features/projects/project-queries';
import { requireActiveUserId } from '@/shared/lib/session';
import { SparklesGlyph } from '@/shared/ui/brand-icons';
import { WORKSPACE_BODY_CLASS } from '@/shared/ui/workspace-ui';

export default async function AppDashboardPage() {
  const userId = await requireActiveUserId();
  const projects = await listProjectsForUser(userId);
  const initialProjects = projects.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    updatedAt: p.updatedAt.toISOString(),
  }));

  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-6">
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-violet-400/25 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-200/95 backdrop-blur-sm">
          <SparklesGlyph className="h-3.5 w-3.5 text-cyan-300" />
          Workspace
        </div>
        <div className="flex flex-col gap-3">
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Your{' '}
            <span className="bg-gradient-to-r from-violet-300 via-fuchsia-200 to-cyan-300 bg-clip-text text-transparent">
              projects
            </span>
          </h1>
          <p className={`max-w-2xl ${WORKSPACE_BODY_CLASS} text-base leading-relaxed`}>
            Create a project to plan with AI, manage phases, and export or sync to Bitrix24 when you are
            ready.
          </p>
        </div>
      </section>

      <WorkspaceProjectsSection initialProjects={initialProjects} />
    </div>
  );
}
