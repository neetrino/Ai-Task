import {
  DECOMPOSITION_LEVEL_DESCRIPTIONS,
  type PlanPayload,
} from '@/shared/domain/plan';
import { ProjectWorkspaceRailHeader } from '@/features/projects/ProjectWorkspaceRailHeader';
import type { BitrixSettingsProject } from '@/features/projects/BitrixProjectSettingsDialog';
import { SparklesGlyph } from '@/shared/ui/brand-icons';

type ProjectOption = { slug: string; name: string };

/**
 * Project + plan summary for the left workspace rail (top-aligned, compact).
 */
export function ProjectPlanMeta({
  projectName,
  plan,
  projects,
  activeSlug,
  bitrixProject,
  activePhaseId,
}: {
  projectName: string;
  plan: PlanPayload;
  projects: ProjectOption[];
  activeSlug: string;
  bitrixProject: BitrixSettingsProject;
  activePhaseId: string | null;
}) {
  const showSubtitle =
    Boolean(plan.project_title) && plan.project_title !== projectName;

  return (
    <div className="shrink-0 border-b border-workspace-hairline px-3 py-3">
      <div className="flex items-start gap-2">
        <SparklesGlyph className="mt-2 h-3.5 w-3.5 shrink-0 text-neutral-400" />
        <div className="min-w-0 flex-1">
          <ProjectWorkspaceRailHeader
            activePhaseId={activePhaseId}
            activeSlug={activeSlug}
            project={bitrixProject}
            projects={projects}
          />
          {showSubtitle ? (
            <p className="mt-2 text-left text-sm font-medium text-neutral-300">{plan.project_title}</p>
          ) : null}
          <div className="mt-2 text-left text-xs leading-relaxed text-neutral-500">
            {plan.decomposition_level ? (
              <p title="Relative depth; task counts scale with project size">
                <span className="font-medium text-neutral-400">Decomposition:</span>{' '}
                {plan.decomposition_level} —{' '}
                {DECOMPOSITION_LEVEL_DESCRIPTIONS[plan.decomposition_level]}
              </p>
            ) : (
              <p className="text-neutral-500">
                No decomposition level yet — the assistant should ask coarse / balanced / fine
                before a full breakdown.
              </p>
            )}
            {plan.decomposition_estimate_note ? (
              <p className="mt-1 text-neutral-500">{plan.decomposition_estimate_note}</p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
