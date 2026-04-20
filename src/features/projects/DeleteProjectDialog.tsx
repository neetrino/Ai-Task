'use client';

import { useEffect, useId, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { deleteProject } from '@/features/projects/project-actions';
import {
  WORKSPACE_BODY_CLASS,
  WORKSPACE_FIELD_CLASS,
  WORKSPACE_GHOST_BTN_CLASS,
} from '@/shared/ui/workspace-ui';
import { WorkspaceModal } from '@/shared/ui/WorkspaceModal';

const DANGER_BTN_CLASS =
  'rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50';

type DeleteProjectDialogProps = {
  open: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  /** Called after a successful deletion (e.g. to refresh list / navigate away). */
  onDeleted: () => void;
};

/**
 * Strong-confirmation modal: the user must type the exact project name
 * before the destructive action becomes available.
 */
export function DeleteProjectDialog({
  open,
  onClose,
  projectId,
  projectName,
  onDeleted,
}: DeleteProjectDialogProps) {
  const [confirm, setConfirm] = useState('');
  const [isPending, startTransition] = useTransition();
  const inputId = useId();

  useEffect(() => {
    if (!open) setConfirm('');
  }, [open]);

  const matches = confirm.trim() === projectName;

  function handleDelete() {
    if (!matches || isPending) return;
    startTransition(async () => {
      const result = await deleteProject(projectId, confirm.trim());
      if ('error' in result) {
        toast.error(result.error);
        return;
      }
      toast.success(`Project "${projectName}" deleted.`);
      onDeleted();
      onClose();
    });
  }

  return (
    <WorkspaceModal onClose={isPending ? () => undefined : onClose} open={open} title="Delete project">
      <div className="space-y-4">
        <p className={`${WORKSPACE_BODY_CLASS} leading-relaxed`}>
          This will permanently delete{' '}
          <span className="font-medium text-neutral-100">{projectName}</span> and all of its
          phases, messages, plans, attachments and usage history. This action cannot be undone.
        </p>

        <div className="space-y-2">
          <label className="block text-xs font-medium text-neutral-300" htmlFor={inputId}>
            Type the project name to confirm
          </label>
          <input
            autoComplete="off"
            className={`w-full ${WORKSPACE_FIELD_CLASS}`}
            disabled={isPending}
            id={inputId}
            onChange={(e) => setConfirm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && matches) {
                e.preventDefault();
                handleDelete();
              }
            }}
            placeholder={projectName}
            type="text"
            value={confirm}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            className={WORKSPACE_GHOST_BTN_CLASS}
            disabled={isPending}
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
          <button
            aria-busy={isPending}
            className={DANGER_BTN_CLASS}
            disabled={!matches || isPending}
            onClick={handleDelete}
            type="button"
          >
            {isPending ? 'Deleting…' : 'Delete project'}
          </button>
        </div>
      </div>
    </WorkspaceModal>
  );
}
