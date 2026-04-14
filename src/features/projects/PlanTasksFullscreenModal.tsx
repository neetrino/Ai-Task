'use client';

import { useEffect, useId, useMemo, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type { PlanPayload } from '@/shared/domain/plan';
import {
  buildFlatPlanTasks,
  filterFlatPlanTasks,
  type FlatPlanTaskRow,
} from '@/features/projects/plan-tasks-iterate';
import { PlanTaskRowCard } from '@/features/projects/PlanTaskRowCard';
import { WORKSPACE_FIELD_CLASS } from '@/shared/ui/workspace-ui';

type EditingTarget = { epicIndex: number; taskIndex: number };

export function PlanTasksFullscreenModal({
  open,
  onClose,
  plan,
  title = 'All tasks',
  projectSlug,
  phaseId,
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
  pending,
  saveNote,
  syncNote,
  planLoading = false,
  fetchError = null,
}: {
  open: boolean;
  onClose: () => void;
  plan: PlanPayload;
  title?: string;
  projectSlug: string;
  phaseId: string | null;
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
  pending: boolean;
  saveNote: string | null;
  syncNote: string | null;
  planLoading?: boolean;
  fetchError?: string | null;
}) {
  const titleId = useId();
  const searchId = useId();
  const [mounted, setMounted] = useState(false);
  const rows = useMemo(() => buildFlatPlanTasks(plan), [plan]);
  const filtered = useMemo(() => filterFlatPlanTasks(rows, search), [rows, search]);
  const taskPhaseHref = useMemo(() => {
    const base = `/app/projects/${projectSlug}`;
    const phaseQ = phaseId ? `?phase=${phaseId}` : '';
    return `${base}${phaseQ}`;
  }, [phaseId, projectSlug]);

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

  if (!mounted || !open) return null;

  const content: ReactNode = (
    <div
      aria-labelledby={titleId}
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-stretch justify-center p-3 sm:p-4"
      role="dialog"
    >
      <button
        aria-label="Close dialog"
        className="absolute inset-0 bg-black/65 backdrop-blur-[2px]"
        onClick={onClose}
        type="button"
      />
      <div className="relative z-[101] flex h-[min(100dvh,100vh)] w-full max-w-[100vw] flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-950/95 shadow-2xl shadow-black/60 ring-1 ring-white/5 backdrop-blur-xl">
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
          <div className="min-w-0">
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
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
                      onNavigateTask={onClose}
                      onSaveEdit={onSaveEdit}
                      onToggleSync={() => onToggleSync(row)}
                      pending={pending}
                      row={row}
                      taskHref={taskPhaseHref}
                      variant="grid"
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
