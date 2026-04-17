'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import type { ReactNode } from 'react';
import { useEffect, useRef, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { touchPhaseActivity, updatePhaseLabel } from '@/features/phases/phase-actions';
import type { PhaseRailEntry } from '@/features/phases/phase-rail-order';
import { PhaseCreateSidebarRow } from '@/features/phases/PhaseCreateSidebarRow';
import { PhaseRowMoreMenu } from '@/features/phases/PhaseRowMoreMenu';
import { TASK_LIST_TOGGLE_DATA_KEY } from '@/features/projects/plan-tasks-layout';
import { ALL_TASKS_PANEL_QUERY_KEY, buildProjectPageHref } from '@/features/projects/project-plan-tasks-url';
import { useProjectPlanTasks } from '@/features/projects/project-plan-tasks-context';
import { ListChecksGlyph } from '@/shared/ui/brand-icons';

/** Active row: flat solid violet — same family as Create project (`PROJECTS_CREATE_BTN_CLASS`), no shadows. */
/** `pr-0` + Tasks `rounded-r-xl`: no violet padding strip after the Tasks chip; reads as one bar with the title. */
/** py-0 so the row height is driven by the Tasks button, matching its outline thickness. */
const PHASE_ROW_WRAP_ACTIVE =
  'overflow-hidden rounded-xl border-0 bg-violet-600 py-0 pl-2 pr-0 shadow-none outline-none transition';
/** Idle row: same geometry as active; quiet = no rim/fill — chrome on hover / focus-within only. */
const PHASE_ROW_WRAP_IDLE =
  'overflow-hidden rounded-xl border border-transparent bg-transparent py-0 pl-2 pr-0 transition-colors hover:border-white/[0.12] hover:bg-neutral-900/50 focus-within:border-white/[0.12] focus-within:bg-neutral-900/50';

const LINK_ACTIVE = 'font-medium text-white';
const LINK_IDLE = 'font-medium text-neutral-200 hover:text-neutral-50';

/** Inline rename: dark bar, native text selection (blue highlight) on focus */
const PHASE_LABEL_INPUT_CLASS =
  'min-w-0 flex-1 rounded-lg border border-white/[0.12] bg-neutral-800/95 px-2 py-0.5 text-left text-sm font-medium leading-snug text-neutral-100 shadow-none outline-none ring-1 ring-blue-500/35 focus:border-white/[0.18] focus:ring-blue-500/50';

function tasksButtonClass(isTasksPanelOpen: boolean, isRowActive: boolean): string {
  /** Same radius on every row so the Tasks chip meets the bar edge like the active violet pill. */
  const radius = 'rounded-l-md rounded-r-xl';
  const base = `flex shrink-0 items-center gap-1.5 border px-2 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 ${radius}`;
  if (isTasksPanelOpen && isRowActive) {
    // Open on solid violet row: dark chip so it does not merge with row fill.
    return `${base} border-white/20 bg-neutral-950 text-white shadow-sm hover:border-white/30 hover:bg-neutral-900 focus-visible:ring-white/40`;
  }
  if (isTasksPanelOpen) {
    return `${base} border-violet-500/40 bg-violet-600 text-white shadow-sm hover:bg-violet-500 focus-visible:ring-violet-300/50`;
  }
  if (isRowActive) {
    // Resting on active row: darker inset chip, reads as secondary to the title link.
    return `${base} border-violet-900/40 bg-violet-800/70 text-white hover:border-violet-300/35 hover:bg-violet-800 focus-visible:ring-white/35`;
  }
  return `${base} border-transparent bg-transparent text-neutral-400 group-hover:border-white/12 group-hover:bg-neutral-950 group-hover:text-neutral-100 group-focus-within:border-white/12 group-focus-within:bg-neutral-950 group-focus-within:text-neutral-100 focus-visible:border-white/15 focus-visible:bg-neutral-950 focus-visible:text-neutral-100 focus-visible:ring-violet-500/35`;
}

function tasksCountBadgeClass(isRowActive: boolean, isTasksPanelOpen: boolean): string {
  const base =
    'flex h-5 min-w-[1.25rem] items-center justify-center rounded-md px-1 text-[10px] font-bold tabular-nums ring-1';
  if (isTasksPanelOpen && isRowActive) {
    return `${base} bg-white/15 text-white ring-white/25`;
  }
  if (isTasksPanelOpen) {
    return `${base} bg-white/12 text-white ring-white/20`;
  }
  if (isRowActive) {
    return `${base} bg-black/30 text-violet-100 ring-violet-200/25`;
  }
  const quiet =
    'flex h-5 min-w-[1.25rem] items-center justify-center rounded-md px-1 text-[10px] font-bold tabular-nums bg-transparent text-neutral-500 ring-0 group-hover:ring-1 group-hover:ring-white/10 group-hover:bg-neutral-950 group-hover:text-neutral-200 group-focus-within:ring-1 group-focus-within:ring-white/10 group-focus-within:bg-neutral-950 group-focus-within:text-neutral-200';
  return quiet;
}

function PhaseChatRow({
  isActive,
  isTasksPanelOpen,
  href,
  label,
  onPhaseNavigate,
  taskCount,
  onOpenTasks,
  tasksAriaLabel,
  tasksTitle,
  phaseMenu,
  labelEdit,
}: {
  isActive: boolean;
  isTasksPanelOpen: boolean;
  href: string;
  label: string;
  onPhaseNavigate?: () => void;
  taskCount: number;
  onOpenTasks: () => void;
  tasksAriaLabel: string;
  tasksTitle: string;
  phaseMenu?: ReactNode;
  labelEdit?: {
    isEditing: boolean;
    draft: string;
    onDraftChange: (v: string) => void;
    onCommit: (value: string) => void;
    onCancel: () => void;
  };
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const skipBlurCommitRef = useRef(false);

  useEffect(() => {
    if (!labelEdit?.isEditing) return;
    const el = inputRef.current;
    if (!el) return;
    el.focus();
    el.select();
  }, [labelEdit?.isEditing]);

  const wrap = `${isActive ? PHASE_ROW_WRAP_ACTIVE : PHASE_ROW_WRAP_IDLE} group`;
  return (
    <div className={wrap}>
      <div className="flex min-w-0 items-center gap-1">
        {labelEdit?.isEditing ? (
          <input
            aria-label="Phase name"
            autoComplete="off"
            className={PHASE_LABEL_INPUT_CLASS}
            maxLength={200}
            onBlur={() => {
              if (skipBlurCommitRef.current) {
                skipBlurCommitRef.current = false;
                return;
              }
              const el = inputRef.current;
              if (!el) return;
              labelEdit.onCommit(el.value);
            }}
            onChange={(e) => labelEdit.onDraftChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                (e.target as HTMLInputElement).blur();
              }
              if (e.key === 'Escape') {
                e.preventDefault();
                skipBlurCommitRef.current = true;
                labelEdit.onCancel();
              }
            }}
            ref={inputRef}
            type="text"
            value={labelEdit.draft}
          />
        ) : (
          <Link
            className={`min-w-0 flex-1 truncate py-0.5 text-left text-sm leading-snug transition ${isActive ? `px-1 pr-2 ${LINK_ACTIVE}` : `px-1 pr-2 ${LINK_IDLE}`}`}
            href={href}
            onClick={() => onPhaseNavigate?.()}
          >
            {label}
          </Link>
        )}
        {phaseMenu}
        <button
          aria-label={tasksAriaLabel}
          aria-pressed={isTasksPanelOpen}
          className={tasksButtonClass(isTasksPanelOpen, isActive)}
          onClick={() => onOpenTasks()}
          title={tasksTitle}
          type="button"
          {...{ [TASK_LIST_TOGGLE_DATA_KEY]: '' }}
        >
          <ListChecksGlyph
            className={`h-4 w-4 shrink-0 ${isTasksPanelOpen && isActive ? 'opacity-100' : 'opacity-90'}`}
          />
          <span className={tasksCountBadgeClass(isActive, isTasksPanelOpen)}>{taskCount}</span>
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
  phaseRail,
  activePhaseId,
  taskCounts,
}: {
  projectId: string;
  projectSlug: string;
  phaseRail: PhaseRailEntry[];
  activePhaseId: string | null;
  taskCounts: { main: number; byPhaseId: Record<string, number> };
}) {
  const router = useRouter();
  const { openTasksForPhase, openTasksPhaseId } = useProjectPlanTasks();
  const searchParams = useSearchParams();
  const preservedAllTasks = searchParams.get(ALL_TASKS_PANEL_QUERY_KEY);
  const isTasksPanelOpenForMain = openTasksPhaseId === null;

  const [editingPhaseId, setEditingPhaseId] = useState<string | null>(null);
  const [draftLabel, setDraftLabel] = useState('');
  const [, startTransition] = useTransition();

  function commitRename(phaseId: string, originalLabel: string, value: string) {
    const trimmed = value.trim();
    if (trimmed === originalLabel) {
      setEditingPhaseId(null);
      return;
    }
    setEditingPhaseId(null);
    startTransition(async () => {
      const result = await updatePhaseLabel(projectId, phaseId, trimmed);
      if ('error' in result) {
        toast.error(result.error);
        setEditingPhaseId(phaseId);
        setDraftLabel(trimmed);
        return;
      }
      toast.success('Phase renamed.');
      router.refresh();
    });
  }

  function cancelRename() {
    setEditingPhaseId(null);
  }

  return (
    <nav aria-label="Phases" className="flex min-h-0 flex-1 flex-col overflow-hidden px-2 py-3">
      <div className="shrink-0 px-1 pb-2">
        <PhaseCreateSidebarRow projectId={projectId} projectSlug={projectSlug} />
      </div>
      <div className="scrollbar-workspace-subtle min-h-0 flex-1 overflow-y-auto pt-2">
        <div className="flex flex-col gap-1.5 pr-0.5">
          {phaseRail.map((entry) => {
            if (entry.kind === 'main') {
              return (
                <PhaseChatRow
                  href={buildProjectPageHref(projectSlug, { allTasks: preservedAllTasks })}
                  isActive={activePhaseId === null}
                  isTasksPanelOpen={isTasksPanelOpenForMain}
                  key="main"
                  label="Main"
                  onOpenTasks={() => openTasksForPhase(null)}
                  onPhaseNavigate={() => {
                    void touchPhaseActivity(projectId, null);
                  }}
                  taskCount={taskCounts.main}
                  tasksAriaLabel={`Tasks for Main, ${taskCounts.main} tasks`}
                  tasksTitle="Open task list for Main"
                />
              );
            }
            const p = entry.phase;
            const isEditingThis = editingPhaseId === p.id;
            return (
              <PhaseChatRow
                href={buildProjectPageHref(projectSlug, { phaseId: p.id, allTasks: preservedAllTasks })}
                isActive={activePhaseId === p.id}
                isTasksPanelOpen={openTasksPhaseId === p.id}
                key={p.id}
                label={p.label}
                labelEdit={
                  isEditingThis
                    ? {
                        isEditing: true,
                        draft: draftLabel,
                        onDraftChange: setDraftLabel,
                        onCancel: cancelRename,
                        onCommit: (v) => commitRename(p.id, p.label, v),
                      }
                    : undefined
                }
                onOpenTasks={() => openTasksForPhase(p.id)}
                onPhaseNavigate={() => {
                  void touchPhaseActivity(projectId, p.id);
                }}
                phaseMenu={
                  <PhaseRowMoreMenu
                    isActiveRow={activePhaseId === p.id}
                    isRowEditing={isEditingThis}
                    onRename={() => {
                      setDraftLabel(p.label);
                      setEditingPhaseId(p.id);
                    }}
                  />
                }
                taskCount={taskCounts.byPhaseId[p.id] ?? 0}
                tasksAriaLabel={`Tasks for ${p.label}, ${taskCounts.byPhaseId[p.id] ?? 0} tasks`}
                tasksTitle={`Open task list for ${p.label}`}
              />
            );
          })}
        </div>
      </div>
    </nav>
  );
}
