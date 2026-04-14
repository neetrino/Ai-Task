'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { syncProjectToBitrix } from '@/features/bitrix-sync/sync-actions';
import { setBitrixSyncCompleted } from '@/features/projects/project-actions';
import { WORKSPACE_GHOST_BTN_CLASS, WORKSPACE_LABEL_CLASS } from '@/shared/ui/workspace-ui';

const SYNC_CHECKBOX_ID = 'bitrix-sync-completed';

export function SyncToolbar({
  projectId,
  phaseId,
  bitrixSyncCompleted,
}: {
  projectId: string;
  phaseId: string | null;
  bitrixSyncCompleted: boolean;
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [completedLocal, setCompletedLocal] = useState(bitrixSyncCompleted);
  const [pending, start] = useTransition();
  const [togglePending, startToggle] = useTransition();

  useEffect(() => {
    setCompletedLocal(bitrixSyncCompleted);
  }, [bitrixSyncCompleted]);

  function run(dryRun: boolean) {
    setMessage(null);
    setError(null);
    start(async () => {
      const res = await syncProjectToBitrix(projectId, phaseId, dryRun);
      if ('error' in res) {
        setError(res.error);
        return;
      }
      setMessage(res.message);
      if (!dryRun) {
        setCompletedLocal(true);
        router.refresh();
      }
    });
  }

  function onToggleCompleted(next: boolean) {
    setError(null);
    startToggle(async () => {
      setCompletedLocal(next);
      await setBitrixSyncCompleted(projectId, next);
      router.refresh();
    });
  }

  const syncBlocked = completedLocal;

  return (
    <div className="flex flex-col gap-3">
      <label
        className={`flex cursor-pointer items-start gap-2.5 ${WORKSPACE_LABEL_CLASS}`}
        htmlFor={SYNC_CHECKBOX_ID}
      >
        <input
          checked={completedLocal}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-white/25 bg-white/[0.06] text-emerald-500 focus:ring-emerald-500/40"
          disabled={togglePending}
          id={SYNC_CHECKBOX_ID}
          onChange={(e) => onToggleCompleted(e.target.checked)}
          type="checkbox"
        />
        <span className="text-sm font-normal leading-snug text-slate-300">
          Sync already completed — uncheck this to run &quot;Sync to Bitrix&quot; again (auto-enabled
          after a successful sync).
        </span>
      </label>
      <div className="flex flex-wrap gap-2">
        <button
          className={WORKSPACE_GHOST_BTN_CLASS}
          disabled={pending}
          onClick={() => run(true)}
          type="button"
        >
          Dry-run sync
        </button>
        <button
          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:opacity-60"
          disabled={pending || syncBlocked}
          onClick={() => run(false)}
          type="button"
        >
          {pending ? 'Syncing…' : 'Sync to Bitrix'}
        </button>
      </div>
      {syncBlocked ? (
        <p className="text-xs leading-relaxed text-amber-200/90">
          Repeat sync is blocked while this box is checked. Uncheck it if you need to push again.
        </p>
      ) : null}
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-400/95">{message}</p> : null}
    </div>
  );
}
