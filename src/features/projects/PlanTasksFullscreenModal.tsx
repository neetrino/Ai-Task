'use client';

import { useEffect, useId, useMemo, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type { PlanPayload } from '@/shared/domain/plan';
import {
  buildFlatPlanTasks,
  filterFlatPlanTasks,
  type FlatPlanTaskRow,
} from '@/features/projects/plan-tasks-iterate';
import { SyncToolbar } from '@/features/bitrix-sync/SyncToolbar';
import { PlanTaskRowCard } from '@/features/projects/PlanTaskRowCard';
import { WORKSPACE_FIELD_CLASS, WORKSPACE_GHOST_BTN_CLASS } from '@/shared/ui/workspace-ui';

type EditingTarget = { epicIndex: number; taskIndex: number };

type TasksViewMode = 'grid' | 'list';

/** Left strip (~20% viewport): glass backdrop, click closes drawer. */
const TASKS_DRAWER_BACKDROP_WIDTH_CLASS = 'w-1/5';
/** Right panel (~80% viewport): task list. */
const TASKS_DRAWER_PANEL_WIDTH_CLASS = 'w-4/5';
const TASKS_DRAWER_SLIDE_TRANSITION_CLASS = 'transition-transform duration-300 ease-out';

export function PlanTasksFullscreenModal({
  open,
  onClose,
  plan,
  title = 'All tasks',
  search,
  onSearchChange,
  editing,
  draftTitle,
  draftDescription,
  onDraftTitleChange,
  onDraftDescriptionChange,
  onBeginEdit,
  onCancelEdit,
  onSaveEdit,
  onToggleSync,
  savePending,
  saveNote,
  syncNote,
  planLoading = false,
  fetchError = null,
  projectId,
  phaseId,
  exportMarkdownHref,
}: {
  open: boolean;
  onClose: () => void;
  plan: PlanPayload;
  projectId: string;
  phaseId: string | null;
  exportMarkdownHref: string;
  title?: string;
  search: string;
  onSearchChange: (value: string) => void;
  editing: EditingTarget | null;
  draftTitle: string;
  draftDescription: string;
  onDraftTitleChange: (value: string) => void;
  onDraftDescriptionChange: (value: string) => void;
  onBeginEdit: (row: FlatPlanTaskRow) => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onToggleSync: (row: FlatPlanTaskRow) => void;
  /** True while task edit save is in flight (does not block Select/Deselect). */
  savePending: boolean;
  saveNote: string | null;
  syncNote: string | null;
  planLoading?: boolean;
  fetchError?: string | null;
}) {
  const titleId = useId();
  const searchId = useId();
  const tasksLayoutRegionId = useId();
  const [mounted, setMounted] = useState(false);
  const [panelEntered, setPanelEntered] = useState(false);
  const [viewMode, setViewMode] = useState<TasksViewMode>('grid');
  const rows = useMemo(() => buildFlatPlanTasks(plan), [plan]);
  const filtered = useMemo(() => filterFlatPlanTasks(rows, search), [rows, search]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    setPanelEntered(false);
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setPanelEntered(true);
      });
    });
    return () => cancelAnimationFrame(id);
  }, [open]);

  if (!mounted || !open) return null;

  const content: ReactNode = (
    <div
      aria-labelledby={titleId}
      aria-modal="true"
      className="fixed inset-0 z-[100] flex flex-row"
      role="dialog"
    >
      <button
        aria-label="Close dialog"
        className={`${TASKS_DRAWER_BACKDROP_WIDTH_CLASS} h-dvh shrink-0 cursor-pointer border-0 bg-slate-950/35 p-0 backdrop-blur-xl backdrop-saturate-150 transition-colors hover:bg-slate-950/45`}
        onClick={onClose}
        type="button"
      />
      <div
        className={`relative z-[101] flex h-dvh min-h-0 shrink-0 flex-col overflow-hidden rounded-l-2xl border border-white/10 border-r-0 bg-slate-950/95 shadow-2xl shadow-black/60 ring-1 ring-white/5 backdrop-blur-xl ${TASKS_DRAWER_PANEL_WIDTH_CLASS} ${TASKS_DRAWER_SLIDE_TRANSITION_CLASS} ${
          panelEntered ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex shrink-0 flex-col gap-3 border-b border-white/10 px-4 py-3 sm:px-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold tracking-tight text-white" id={titleId}>
                {title}
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">{filtered.length} tasks</p>
            </div>
            <button
              className="shrink-0 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-slate-300 transition hover:border-white/25 hover:bg-white/10 hover:text-white"
              onClick={onClose}
              type="button"
            >
              Close
            </button>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
            <div className="min-w-0 flex-1 sm:min-w-[12rem]">
              <label className="sr-only" htmlFor={searchId}>
                Search tasks
              </label>
              <input
                className={`w-full ${WORKSPACE_FIELD_CLASS} text-xs`}
                id={searchId}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search tasks…"
                type="search"
                value={search}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:min-w-0 sm:justify-end">
              <SyncToolbar compact phaseId={phaseId} projectId={projectId} variant="syncOnly" />
              <a
                className={`inline-flex shrink-0 items-center justify-center ${WORKSPACE_GHOST_BTN_CLASS} px-2 py-1 text-xs`}
                download
                href={exportMarkdownHref}
              >
                Markdown
              </a>
            </div>
            <div
              className="flex shrink-0 rounded-lg border border-white/10 bg-slate-900/80 p-0.5 sm:ml-auto"
              role="group"
              aria-label="Task layout"
            >
              <button
                aria-controls={tasksLayoutRegionId}
                aria-pressed={viewMode === 'grid'}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                  viewMode === 'grid'
                    ? 'bg-white/10 text-white ring-1 ring-white/15'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                onClick={() => setViewMode('grid')}
                type="button"
              >
                Grid
              </button>
              <button
                aria-controls={tasksLayoutRegionId}
                aria-pressed={viewMode === 'list'}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                  viewMode === 'list'
                    ? 'bg-white/10 text-white ring-1 ring-white/15'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                onClick={() => setViewMode('list')}
                type="button"
              >
                List
              </button>
            </div>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
          {saveNote ? <p className="mb-2 text-xs text-red-400">{saveNote}</p> : null}
          {syncNote ? <p className="mb-2 text-xs text-red-400">{syncNote}</p> : null}
          {planLoading ? (
            <p className="py-12 text-center text-sm text-slate-400">Loading plan…</p>
          ) : null}
          {!planLoading && fetchError ? (
            <p className="py-8 text-center text-sm text-red-400">{fetchError}</p>
          ) : null}
          {!planLoading && !fetchError ? (
            <>
              <div
                className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4'
                    : 'flex flex-col gap-2'
                }
                id={tasksLayoutRegionId}
              >
                {filtered.map((row) => {
                  const isEditing =
                    editing?.epicIndex === row.epicIndex && editing?.taskIndex === row.taskIndex;
                  return (
                    <PlanTaskRowCard
                      draftDescription={draftDescription}
                      draftTitle={draftTitle}
                      isEditing={isEditing}
                      key={`${row.epicIndex}-${row.taskIndex}`}
                      onBeginEdit={() => onBeginEdit(row)}
                      onCancelEdit={onCancelEdit}
                      onDraftDescriptionChange={onDraftDescriptionChange}
                      onDraftTitleChange={onDraftTitleChange}
                      onSaveEdit={onSaveEdit}
                      onToggleSync={() => onToggleSync(row)}
                      savePending={savePending}
                      row={row}
                      variant={viewMode === 'grid' ? 'grid' : 'list'}
                    />
                  );
                })}
              </div>
              {filtered.length === 0 ? (
                <p className="py-8 text-center text-xs text-slate-500">No tasks match your search.</p>
              ) : null}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
