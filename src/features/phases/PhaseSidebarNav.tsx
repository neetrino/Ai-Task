'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { Phase } from '@prisma/client';
import { PhaseCreateForm } from '@/features/phases/PhaseCreateForm';
import { useProjectPlanTasks } from '@/features/projects/project-plan-tasks-context';
import { ListChecksGlyph } from '@/shared/ui/brand-icons';

const PHASE_ROW_WRAP_ACTIVE =
  'rounded-xl border border-violet-400/45 bg-gradient-to-r from-violet-500/[0.28] via-violet-500/[0.14] to-cyan-500/[0.12] p-2 shadow-[0_0_0_1px_rgba(139,92,246,0.2),inset_0_1px_0_0_rgba(255,255,255,0.08)]';
const PHASE_ROW_WRAP_IDLE =
  'rounded-xl border border-transparent p-2 transition hover:border-white/[0.08] hover:bg-white/[0.04]';

const LINK_ACTIVE = 'font-semibold text-white';
const LINK_IDLE = 'font-medium text-slate-400 hover:text-slate-100';

function tasksButtonClass(isRowActive: boolean): string {
  const base =
    'flex shrink-0 items-center gap-1.5 rounded-lg border px-2 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/50';
  if (isRowActive) {
    return `${base} border-violet-300/45 bg-black/20 text-violet-100 hover:bg-violet-500/25 hover:border-violet-300/55`;
  }
  return `${base} border-white/15 bg-slate-950/70 text-slate-200 hover:border-violet-400/35 hover:bg-violet-500/[0.12] hover:text-white`;
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
        >
          <ListChecksGlyph className="h-4 w-4 shrink-0 opacity-90" />
          <span>Tasks</span>
          <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-md bg-black/30 px-1 text-[10px] font-bold tabular-nums text-slate-100 ring-1 ring-white/10">
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

  return (
    <nav aria-label="Phases" className="flex min-h-0 flex-1 flex-col overflow-hidden px-2 py-2">
      <p className="shrink-0 px-1 pb-2 text-[10px] font-medium uppercase tracking-wide text-slate-500">
        Phases
      </p>
      <div className="scrollbar-workspace-subtle min-h-0 flex-1 overflow-y-auto">
        <div className="flex flex-col gap-2 pr-0.5">
          <PhaseChatRow
            href={`/app/projects/${projectSlug}`}
            isActive={activePhaseId === null}
            label="Main"
            onOpenTasks={() => openTasksForPhase(null)}
            taskCount={taskCounts.main}
            tasksAriaLabel={`Tasks for Main, ${taskCounts.main} tasks`}
            tasksTitle="Open task list for Main"
          />
          {phases.map((p) => (
            <PhaseChatRow
              href={`/app/projects/${projectSlug}?phase=${p.id}`}
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
      <div className="shrink-0 border-t border-white/10 pt-2">
        <button
          aria-expanded={addOpen}
          className="flex w-full items-center gap-2 rounded-xl border border-transparent px-2 py-2 text-left text-sm font-medium text-slate-500 transition hover:border-white/[0.08] hover:bg-white/[0.04] hover:text-slate-300"
          onClick={() => setAddOpen((v) => !v)}
          type="button"
        >
          <span aria-hidden className="text-base leading-none">
            +
          </span>
          <span className="min-w-0 truncate">New phase</span>
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
