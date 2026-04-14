import {
  DECOMPOSITION_LEVEL_DESCRIPTIONS,
  type PlanPayload,
} from '@/shared/domain/plan';
import { SparklesGlyph } from '@/shared/ui/brand-icons';
import { WORKSPACE_PANEL_CLASS } from '@/shared/ui/workspace-ui';

export function PlanTasksPanel({ plan }: { plan: PlanPayload }) {
  return (
    <div className={`flex h-full min-h-0 flex-col ${WORKSPACE_PANEL_CLASS}`}>
      <div className="border-b border-white/10 bg-gradient-to-r from-violet-500/10 to-cyan-500/10 px-4 py-3">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-violet-200/90">
          <SparklesGlyph className="h-3.5 w-3.5 text-cyan-300" />
          AI plan
        </div>
        {plan.project_title ? (
          <p className="mt-1 text-sm font-medium text-slate-100">{plan.project_title}</p>
        ) : (
          <p className="mt-1 text-xs text-slate-500">Structured tasks from the latest snapshot</p>
        )}
        {plan.decomposition_level ? (
          <div className="mt-1 space-y-1 text-xs leading-snug text-slate-400">
            <p title="Relative depth; task counts scale with project size">
              <span className="font-medium text-slate-300">Decomposition:</span>{' '}
              {plan.decomposition_level} — {DECOMPOSITION_LEVEL_DESCRIPTIONS[plan.decomposition_level]}
            </p>
            {plan.decomposition_estimate_note ? (
              <p className="text-slate-500">{plan.decomposition_estimate_note}</p>
            ) : null}
          </div>
        ) : (
          <p className="mt-1 text-xs text-slate-500">
            No decomposition level yet — the assistant should ask coarse / balanced / fine (with
            scope-specific estimates) before a full breakdown.
          </p>
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        <ul className="space-y-5">
          {plan.epics.map((epic, ei) => (
            <li key={`${epic.name}-${ei}`}>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                {epic.name}
              </p>
              {epic.description ? (
                <p className="mt-1 text-xs leading-relaxed text-slate-500">{epic.description}</p>
              ) : null}
              <ul className="mt-2 space-y-2 border-l border-white/10 pl-3">
                {epic.tasks.map((task, ti) => (
                  <li key={`${ei}-${ti}-${task.title}`}>
                    <p className="flex flex-wrap items-baseline gap-2 text-sm text-slate-200">
                      {task.size ? (
                        <span
                          className="shrink-0 rounded border border-white/15 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-400"
                          title={
                            task.size === 'small'
                              ? 'Small — sub-step / short task'
                              : task.size === 'medium'
                                ? 'Medium — feature-sized'
                                : 'Large — milestone or major work'
                          }
                        >
                          {task.size === 'small' ? 'S' : task.size === 'medium' ? 'M' : 'L'}
                        </span>
                      ) : null}
                      <span>{task.title}</span>
                    </p>
                    {task.description ? (
                      <p className="mt-0.5 text-xs leading-snug text-slate-500">{task.description}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
