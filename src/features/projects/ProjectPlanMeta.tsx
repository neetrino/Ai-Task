import type { PlanPayload } from '@/shared/domain/plan-defaults';
import { ProjectWorkspaceRailHeader } from '@/features/projects/ProjectWorkspaceRailHeader';
import { SparklesGlyph } from '@/shared/ui/brand-icons';

type ProjectOption = { slug: string; name: string };

/**
 * Project + plan summary for the left workspace rail (top-aligned, compact).
 * Quick actions render separately at the bottom of the rail.
 */
export function ProjectPlanMeta({
  projectName,
  plan,
  projects,
  activeSlug,
}: {
  projectName: string;
  plan: PlanPayload;
  projects: ProjectOption[];
  activeSlug: string;
}) {
  const showSubtitle =
    Boolean(plan.project_title) && plan.project_title !== projectName;

  return (
    <div className="shrink-0 border-b border-workspace-hairline px-2 pb-3 pt-2">
      <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-2">
        <SparklesGlyph className="col-start-1 row-start-1 h-3.5 w-3.5 shrink-0 self-center text-neutral-400" />
        <div className="col-start-2 row-start-1 min-w-0">
          <ProjectWorkspaceRailHeader activeSlug={activeSlug} projects={projects} />
        </div>
        {showSubtitle ? (
          <p className="col-start-2 mt-2 text-left text-sm font-medium text-neutral-300">
            {plan.project_title}
          </p>
        ) : null}
      </div>
    </div>
  );
}
