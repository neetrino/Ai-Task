import { WorkspaceProjectsSection } from '@/features/projects/WorkspaceProjectsSection';
import { listProjectsForUser } from '@/features/projects/project-queries';
import { requireActiveUserId } from '@/shared/lib/session';
import { AppMainConstrained } from '@/shared/ui/AppMainConstrained';
import { SiteLogoImage } from '@/shared/ui/site-logo';
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
    <AppMainConstrained>
      <div className="flex flex-col gap-10">
        <section className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <div className="flex flex-row flex-wrap items-baseline justify-start gap-2 sm:gap-3">
              <h1 className="min-w-0 text-3xl font-semibold leading-tight tracking-tight text-neutral-100 sm:text-4xl">
                Your <span className="text-violet-400">projects</span>
              </h1>
              <div className="inline-flex w-fit shrink-0 items-center gap-2 rounded-full border border-violet-500/35 bg-violet-500/10 px-3 py-1 text-xs font-medium leading-none text-violet-200">
                <SiteLogoImage className="h-3.5 w-auto" heightPx={14} />
                Workspace
              </div>
            </div>
            <p className={`max-w-2xl ${WORKSPACE_BODY_CLASS} text-base leading-relaxed`}>
              Create a project to plan with AI, manage phases, and export or sync to Bitrix24 when you are
              ready.
            </p>
          </div>
        </section>

        <WorkspaceProjectsSection initialProjects={initialProjects} />
      </div>
    </AppMainConstrained>
  );
}
