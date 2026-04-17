'use client';

import { TrashOutlineGlyph } from '@/shared/ui/brand-icons';
import {
  WORKSPACE_FIELD_CLASS,
  WORKSPACE_GHOST_BTN_CLASS,
} from '@/shared/ui/workspace-ui';
import { isTaskSyncChecked, type FlatPlanTaskRow } from '@/features/projects/plan-tasks-iterate';

const LIST_WRAP =
  'rounded-lg border px-2 py-1 outline-none transition focus-visible:ring-2 focus-visible:ring-violet-500/40';
const GRID_WRAP =
  'rounded-xl border px-3 py-3 shadow-none outline-none transition focus-visible:ring-2 focus-visible:ring-violet-500/40';

const DELETE_TASK_BTN_CLASS =
  'inline-flex items-center justify-center rounded-lg border border-red-500/30 bg-red-950/35 p-1.5 text-red-200/90 transition hover:border-red-500/45 hover:bg-red-950/55 disabled:opacity-60';

const SAVE_TASK_BTN_CLASS =
  'rounded-lg border border-emerald-500/35 bg-emerald-950/40 px-3 py-1.5 text-sm text-emerald-100/95 transition hover:border-emerald-400/50 hover:bg-emerald-900/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/35 disabled:opacity-60';

const SYNC_BTN_BASE =
  'shrink-0 rounded-lg border text-[10px] font-semibold uppercase tracking-wide transition focus-visible:outline-none focus-visible:ring-2 disabled:opacity-50';

const SYNC_BTN_SIZE_LIST = 'px-2 py-1';
const SYNC_BTN_SIZE_GRID = 'px-2.5 py-1.5';

function syncToggleButtonClass(syncSelected: boolean, variant: 'list' | 'grid'): string {
  const size = variant === 'list' ? SYNC_BTN_SIZE_LIST : SYNC_BTN_SIZE_GRID;
  if (syncSelected) {
    return `${SYNC_BTN_BASE} ${size} border-violet-500/35 bg-violet-600/20 text-violet-100/95 hover:border-violet-400/45 hover:bg-violet-600/28 focus-visible:ring-violet-500/45`;
  }
  return `${SYNC_BTN_BASE} ${size} border-white/12 bg-neutral-800/90 text-neutral-200 hover:border-white/18 hover:bg-neutral-800 focus-visible:ring-violet-500/35`;
}

const SYNC_BTN_REVEAL =
  'opacity-100 transition-opacity duration-150 [@media(hover:hover)]:pointer-events-none [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:transition-opacity [@media(hover:hover)]:duration-150 [@media(hover:hover)]:group-hover:pointer-events-auto [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:group-focus-within:pointer-events-auto [@media(hover:hover)]:group-focus-within:opacity-100';

const BITRIX_BADGE_CLASS =
  'shrink-0 rounded border border-emerald-500/15 bg-emerald-500/[0.06] px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-200/75';

type ListRowProps = {
  row: FlatPlanTaskRow;
  syncSelected: boolean;
  onToggleSync: () => void;
};

function PlanTaskListRow({ row, syncSelected, onToggleSync }: ListRowProps) {
  return (
    <div className="flex min-w-0 flex-nowrap items-center gap-2 text-sm">
      <span className="shrink-0 tabular-nums font-mono text-[10px] font-medium text-neutral-500">
        {row.displayNumber}
      </span>
      {row.task.bitrixSynced ? (
        <span className={BITRIX_BADGE_CLASS} title="This task was pushed to Bitrix">
          Bitrix
        </span>
      ) : null}
      <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
        <span className="min-w-0 flex-[2_1_0%] truncate font-medium text-neutral-100">{row.task.title}</span>
        {row.task.description ? (
          <span
            className="min-w-0 flex-[3_1_0%] truncate text-xs text-neutral-500"
            title={row.task.description}
          >
            {row.task.description}
          </span>
        ) : null}
      </div>
      <span
        className="max-w-32 shrink truncate text-[10px] uppercase tracking-wide text-neutral-600"
        title={row.epicName}
      >
        {row.epicName}
      </span>
      <button
        aria-pressed={syncSelected}
        className={`${syncToggleButtonClass(syncSelected, 'list')} ${SYNC_BTN_REVEAL}`}
        onClick={(e) => {
          e.stopPropagation();
          onToggleSync();
        }}
        type="button"
      >
        {syncSelected ? 'Deselect' : 'Select'}
      </button>
    </div>
  );
}

type GridRowProps = {
  row: FlatPlanTaskRow;
  syncSelected: boolean;
  onToggleSync: () => void;
};

function PlanTaskGridRow({ row, syncSelected, onToggleSync }: GridRowProps) {
  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="flex min-w-0 flex-1 flex-wrap items-baseline gap-2 text-sm text-neutral-200">
          <span className="shrink-0 tabular-nums font-mono text-[10px] font-medium text-neutral-500">
            {row.displayNumber}
          </span>
          {row.task.bitrixSynced ? (
            <span className={BITRIX_BADGE_CLASS} title="This task was pushed to Bitrix">
              Bitrix
            </span>
          ) : null}
          <span className="min-w-0 font-medium leading-snug text-neutral-100">{row.task.title}</span>
        </p>
        <button
          aria-pressed={syncSelected}
          className={`${syncToggleButtonClass(syncSelected, 'grid')} ${SYNC_BTN_REVEAL}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleSync();
          }}
          type="button"
        >
          {syncSelected ? 'Deselect' : 'Select'}
        </button>
      </div>
      {row.task.description ? (
        <p className="mt-0.5 line-clamp-3 text-xs leading-snug text-neutral-500">{row.task.description}</p>
      ) : null}
      <p className="mt-2 truncate text-[10px] uppercase tracking-wide text-neutral-600">{row.epicName}</p>
    </>
  );
}

type EditFormProps = {
  draftTitle: string;
  draftDescription: string;
  onDraftTitleChange: (value: string) => void;
  onDraftDescriptionChange: (value: string) => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onDeleteEdit: () => void;
  savePending: boolean;
};

function PlanTaskRowEditForm({
  draftTitle,
  draftDescription,
  onDraftTitleChange,
  onDraftDescriptionChange,
  onCancelEdit,
  onSaveEdit,
  onDeleteEdit,
  savePending,
}: EditFormProps) {
  return (
    <div
      className={`space-y-2 rounded-lg border border-violet-500/25 bg-neutral-950/40 p-2 ${savePending ? 'pointer-events-none opacity-70' : ''}`}
    >
      <input
        className={`w-full ${WORKSPACE_FIELD_CLASS} text-xs`}
        onChange={(e) => onDraftTitleChange(e.target.value)}
        value={draftTitle}
      />
      <textarea
        className={`min-h-[72px] w-full resize-y ${WORKSPACE_FIELD_CLASS} text-xs`}
        onChange={(e) => onDraftDescriptionChange(e.target.value)}
        placeholder="Description (optional)"
        value={draftDescription}
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          <button className={WORKSPACE_GHOST_BTN_CLASS} disabled={savePending} onClick={onCancelEdit} type="button">
            Cancel
          </button>
          <button className={SAVE_TASK_BTN_CLASS} disabled={savePending} onClick={onSaveEdit} type="button">
            {savePending ? 'Saving…' : 'Save'}
          </button>
        </div>
        <button
          aria-label="Delete task"
          className={DELETE_TASK_BTN_CLASS}
          disabled={savePending}
          onClick={(e) => {
            e.stopPropagation();
            onDeleteEdit();
          }}
          title="Delete task"
          type="button"
        >
          <TrashOutlineGlyph className="h-4 w-4 shrink-0" />
        </button>
      </div>
    </div>
  );
}

export function PlanTaskRowCard({
  row,
  variant,
  isEditing,
  draftTitle,
  draftDescription,
  onDraftTitleChange,
  onDraftDescriptionChange,
  onBeginEdit,
  onCancelEdit,
  onSaveEdit,
  onDeleteEdit,
  onToggleSync,
  savePending,
}: {
  row: FlatPlanTaskRow;
  variant: 'list' | 'grid';
  isEditing: boolean;
  draftTitle: string;
  draftDescription: string;
  onDraftTitleChange: (value: string) => void;
  onDraftDescriptionChange: (value: string) => void;
  onBeginEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onDeleteEdit: () => void;
  onToggleSync: () => void;
  /** Only for inline save (Cancel/Save); does not block sync toggles on other cards. */
  savePending: boolean;
}) {
  if (isEditing) {
    return (
      <PlanTaskRowEditForm
        draftDescription={draftDescription}
        draftTitle={draftTitle}
        onCancelEdit={onCancelEdit}
        onDeleteEdit={onDeleteEdit}
        onDraftDescriptionChange={onDraftDescriptionChange}
        onDraftTitleChange={onDraftTitleChange}
        onSaveEdit={onSaveEdit}
        savePending={savePending}
      />
    );
  }

  const wrapClass = variant === 'list' ? LIST_WRAP : GRID_WRAP;
  const syncSelected = isTaskSyncChecked(row.task);
  const stateClass = syncSelected
    ? 'cursor-pointer border-violet-500/30 bg-violet-500/[0.07] hover:bg-violet-500/[0.1]'
    : 'cursor-pointer border-white/10 bg-workspace-elevated hover:bg-white/[0.04]';

  return (
    <div
      className={`group ${wrapClass} ${stateClass}`}
      onClick={onBeginEdit}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onBeginEdit();
        }
      }}
      role="button"
      tabIndex={0}
      title="Click the card to edit. Hover to show Select/Deselect for Bitrix sync."
    >
      {variant === 'list' ? (
        <PlanTaskListRow onToggleSync={onToggleSync} row={row} syncSelected={syncSelected} />
      ) : (
        <PlanTaskGridRow onToggleSync={onToggleSync} row={row} syncSelected={syncSelected} />
      )}
    </div>
  );
}
