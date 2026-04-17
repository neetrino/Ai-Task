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

/** Softer than heavy borders: shift in background (ChatGPT-style thread list). */
/** py-0 so the row height is driven by the Tasks button, matching its outline thickness. */
const PHASE_ROW_WRAP_ACTIVE =
  'rounded-xl border border-white/[0.08] bg-workspace-elevated px-2 py-0 shadow-none';
const PHASE_ROW_WRAP_IDLE =
  'rounded-xl border border-transparent px-2 py-0 transition hover:bg-white/[0.04]';

const LINK_ACTIVE = 'font-medium text-neutral-50';
const LINK_IDLE = 'font-medium text-neutral-200 hover:text-neutral-50';

/** Inline rename: dark bar, native text selection (blue highlight) on focus */
const PHASE_LABEL_INPUT_CLASS =
  'min-w-0 flex-1 rounded-lg border border-white/[0.12] bg-neutral-800/95 px-2 py-0.5 text-left text-sm font-medium leading-snug text-neutral-100 shadow-none outline-none ring-1 ring-blue-500/35 focus:border-white/[0.18] focus:ring-blue-500/50';

function tasksButtonClass(isTasksPanelOpen: boolean): string {
  const base =
    'flex shrink-0 items-center gap-1.5 rounded-lg border px-2 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20';
  if (isTasksPanelOpen) {
    return `${base} border-violet-500/40 bg-violet-600 text-white shadow-sm hover:bg-violet-500`;
  }
  return `${base} border-transparent bg-transparent text-neutral-300 hover:border-white/15 hover:bg-neutral-900 hover:text-neutral-100`;
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
      <div className="flex min-w-0 items-center gap-2">
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
            className={`min-w-0 flex-1 truncate rounded-lg px-1 py-0.5 text-left text-sm leading-snug transition ${isActive ? LINK_ACTIVE : LINK_IDLE}`}
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
          className={tasksButtonClass(isTasksPanelOpen)}
          onClick={() => onOpenTasks()}
          title={tasksTitle}
          type="button"
          {...{ [TASK_LIST_TOGGLE_DATA_KEY]: '' }}
        >
          <ListChecksGlyph className="h-4 w-4 shrink-0 opacity-90" />
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
