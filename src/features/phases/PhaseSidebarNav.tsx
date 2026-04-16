'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import type { Phase } from '@prisma/client';
import { PhaseCreateForm } from '@/features/phases/PhaseCreateForm';
import { TASK_LIST_TOGGLE_DATA_KEY } from '@/features/projects/plan-tasks-layout';
import { ALL_TASKS_PANEL_QUERY_KEY, buildProjectPageHref } from '@/features/projects/project-plan-tasks-url';
import { useProjectPlanTasks } from '@/features/projects/project-plan-tasks-context';
import { ListChecksGlyph } from '@/shared/ui/brand-icons';

/** Softer than heavy borders: shift in background (ChatGPT-style thread list). */
const PHASE_ROW_WRAP_ACTIVE =
  'rounded-xl border border-white/[0.08] bg-workspace-elevated p-2.5 shadow-none';
const PHASE_ROW_WRAP_IDLE =
  'rounded-xl border border-transparent p-2.5 transition hover:bg-white/[0.04]';

const LINK_ACTIVE = 'font-medium text-neutral-100';
const LINK_IDLE = 'font-medium text-neutral-400 hover:text-neutral-200';

function tasksButtonClass(isRowActive: boolean): string {
  const base =
    'flex shrink-0 items-center gap-1.5 rounded-lg border px-2 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20';
  if (isRowActive) {
    return `${base} border-white/10 bg-neutral-900 text-neutral-100 hover:bg-neutral-950`;
  }
  return `${base} border-white/10 bg-workspace-canvas text-neutral-300 hover:border-white/15 hover:bg-neutral-900 hover:text-neutral-100`;
}

function PhaseChatRow({
  isActive,
  href,
  label,
  taskCount,
  onOpenTasks,
  tasksAriaLabel,
  tasksTitle,
}: {
  isActive: boolean;
  href: string;
  label: string;
  taskCount: number;
  onOpenTasks: () => void;
  tasksAriaLabel: string;
  tasksTitle: string;
}) {
  return (
    <div className={isActive ? PHASE_ROW_WRAP_ACTIVE : PHASE_ROW_WRAP_IDLE}>
      <div className="flex min-w-0 items-center gap-2">
        <Link
          className={`min-w-0 flex-1 truncate rounded-lg px-1 py-0.5 text-left text-sm leading-snug transition ${isActive ? LINK_ACTIVE : LINK_IDLE}`}
          href={href}
        >
          {label}
        </Link>
        <button
          aria-label={tasksAriaLabel}
          className={tasksButtonClass(isActive)}
          onClick={() => onOpenTasks()}
          title={tasksTitle}
          type="button"
          {...{ [TASK_LIST_TOGGLE_DATA_KEY]: '' }}
        >
          <ListChecksGlyph className="h-4 w-4 shrink-0 opacity-90" />
          <span>Tasks</span>
          <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-md bg-neutral-950 px-1 text-[10px] font-bold tabular-nums text-neutral-200 ring-1 ring-white/10">
            {taskCount}
          </span>
        </button>
      </div>
    </div>
  );
}

/**
 * Phase list (ChatGPT-style threads): full-height scroll; active phase is a full-width highlighted card.
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
  const searchParams = useSearchParams();
  const preservedAllTasks = searchParams.get(ALL_TASKS_PANEL_QUERY_KEY);

  return (
    <nav aria-label="Phases" className="flex min-h-0 flex-1 flex-col overflow-hidden px-2 py-3">
      <p className="shrink-0 px-1 pb-2 text-[10px] font-medium uppercase tracking-wide text-neutral-500">
        Phases
      </p>
      <div className="shrink-0 border-b border-workspace-hairline px-1 pb-3">
        <button
          aria-expanded={addOpen}
          className="flex w-full items-center gap-2 rounded-xl border border-transparent px-2 py-2.5 text-left text-sm font-medium text-neutral-500 transition hover:bg-white/[0.04] hover:text-neutral-300"
          onClick={() => setAddOpen((v) => !v)}
          type="button"
        >
          <span aria-hidden className="text-base leading-none">
            +
          </span>
          <span className="min-w-0 truncate">New phase</span>
        </button>
        {addOpen ? (
          <div className="mt-2 rounded-lg border border-white/[0.08] bg-workspace-elevated p-2">
            <PhaseCreateForm
              onSuccess={() => setAddOpen(false)}
              projectId={projectId}
              variant="inline"
            />
          </div>
        ) : null}
      </div>
      <div className="scrollbar-workspace-subtle min-h-0 flex-1 overflow-y-auto pt-2">
        <div className="flex flex-col gap-1.5 pr-0.5">
          <PhaseChatRow
            href={buildProjectPageHref(projectSlug, { allTasks: preservedAllTasks })}
            isActive={activePhaseId === null}
            label="Main"
            onOpenTasks={() => openTasksForPhase(null)}
            taskCount={taskCounts.main}
            tasksAriaLabel={`Tasks for Main, ${taskCounts.main} tasks`}
            tasksTitle="Open task list for Main"
          />
          {phases.map((p) => (
            <PhaseChatRow
              href={buildProjectPageHref(projectSlug, { phaseId: p.id, allTasks: preservedAllTasks })}
              isActive={activePhaseId === p.id}
              key={p.id}
              label={p.label}
              onOpenTasks={() => openTasksForPhase(p.id)}
              taskCount={taskCounts.byPhaseId[p.id] ?? 0}
              tasksAriaLabel={`Tasks for ${p.label}, ${taskCounts.byPhaseId[p.id] ?? 0} tasks`}
              tasksTitle={`Open task list for ${p.label}`}
            />
          ))}
        </div>
      </div>
    </nav>
  );
}
