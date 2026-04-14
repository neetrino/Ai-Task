'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { Phase } from '@prisma/client';
import { PhaseCreateForm } from '@/features/phases/PhaseCreateForm';
import { useProjectPlanTasks } from '@/features/projects/project-plan-tasks-context';

const PHASE_ROW_ACTIVE =
  'bg-white/12 text-slate-100 shadow-[inset_3px_0_0_0_rgba(139,92,246,0.85)]';
const PHASE_ROW_IDLE =
  'text-slate-400 hover:bg-white/[0.06] hover:text-slate-200';

function phaseRowClass(isActive: boolean): string {
  const base =
    'flex w-full min-w-0 items-center gap-1 rounded-lg px-2 py-2 text-left text-sm font-medium transition';
  return `${base} ${isActive ? PHASE_ROW_ACTIVE : PHASE_ROW_IDLE}`;
}

const TASKS_BTN_CLASS =
  'flex h-8 shrink-0 items-center justify-center gap-1 rounded-md border border-white/12 bg-slate-950/80 px-1.5 text-[10px] font-medium text-slate-300 transition hover:border-white/20 hover:bg-white/[0.06] hover:text-white';

/**
 * Phase list (ChatGPT-style threads): full-height scroll, “Tasks” opens the plan modal for that phase.
 */
export function PhaseSidebarNav({
  projectId,
  projectSlug,
  phases,
  activePhaseId,
  taskCounts,
}: {
  projectId: string;
  projectSlug: string;
  phases: Phase[];
  activePhaseId: string | null;
  taskCounts: { main: number; byPhaseId: Record<string, number> };
}) {
  const [addOpen, setAddOpen] = useState(false);
  const { openTasksForPhase } = useProjectPlanTasks();

  return (
    <nav aria-label="Phases" className="flex min-h-0 flex-1 flex-col overflow-hidden px-2 py-2">
      <p className="shrink-0 px-2 pb-1.5 text-[10px] font-medium uppercase tracking-wide text-slate-500">
        Phases
      </p>
      <div className="scrollbar-workspace-subtle min-h-0 flex-1 overflow-y-auto">
        <div className="flex flex-col gap-0.5 pr-0.5">
          <div className="flex min-w-0 items-stretch gap-1">
            <Link
              className={`${phaseRowClass(activePhaseId === null)} min-w-0 flex-1`}
              href={`/app/projects/${projectSlug}`}
            >
              <span className="min-w-0 truncate">Main</span>
            </Link>
            <button
              aria-label={`View tasks for Main, ${taskCounts.main} tasks`}
              className={TASKS_BTN_CLASS}
              onClick={() => openTasksForPhase(null)}
              title="View tasks for Main"
              type="button"
            >
              <span className="tabular-nums">{taskCounts.main}</span>
            </button>
          </div>
          {phases.map((p) => (
            <div className="flex min-w-0 items-stretch gap-1" key={p.id}>
              <Link
                className={`${phaseRowClass(activePhaseId === p.id)} min-w-0 flex-1`}
                href={`/app/projects/${projectSlug}?phase=${p.id}`}
              >
                <span className="min-w-0 truncate">{p.label}</span>
              </Link>
              <button
                aria-label={`View tasks for ${p.label}, ${taskCounts.byPhaseId[p.id] ?? 0} tasks`}
                className={TASKS_BTN_CLASS}
                onClick={() => openTasksForPhase(p.id)}
                title={`View tasks for ${p.label}`}
                type="button"
              >
                <span className="tabular-nums">{taskCounts.byPhaseId[p.id] ?? 0}</span>
              </button>
            </div>
          ))}
        </div>
      </div>
      <div className="shrink-0 border-t border-white/10 pt-2">
        <button
          aria-expanded={addOpen}
          className={`${phaseRowClass(false)} w-full gap-2 text-slate-500 hover:text-slate-300`}
          onClick={() => setAddOpen((v) => !v)}
          type="button"
        >
          <span aria-hidden className="text-base leading-none">
            +
          </span>
          <span className="min-w-0 truncate text-sm font-medium">New phase</span>
        </button>
        {addOpen ? (
          <div className="mt-2 rounded-lg border border-white/10 bg-slate-950/50 p-2">
            <PhaseCreateForm
              onSuccess={() => setAddOpen(false)}
              projectId={projectId}
              variant="inline"
            />
          </div>
        ) : null}
      </div>
    </nav>
  );
}
