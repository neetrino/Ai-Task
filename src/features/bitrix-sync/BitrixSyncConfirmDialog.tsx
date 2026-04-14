'use client';

import { useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { WORKSPACE_GHOST_BTN_CLASS } from '@/shared/ui/workspace-ui';

const OVERLAY_Z = 'z-[120]';
const PANEL_Z = 'z-[121]';

export function BitrixSyncConfirmDialog({
  open,
  onCancel,
  onConfirm,
  pending,
}: {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  pending: boolean;
}) {
  const titleId = useId();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      e.stopImmediatePropagation();
      onCancel();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [open, onCancel]);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      aria-labelledby={titleId}
      aria-modal="true"
      className={`fixed inset-0 ${OVERLAY_Z} flex items-center justify-center p-4`}
      role="dialog"
    >
      <button
        aria-label="Close dialog"
        className="absolute inset-0 bg-black/65 backdrop-blur-[2px]"
        onClick={onCancel}
        type="button"
      />
      <div
        className={`relative ${PANEL_Z} w-full max-w-md rounded-2xl border border-white/10 bg-slate-950/95 p-5 shadow-2xl shadow-black/60 ring-1 ring-white/5 backdrop-blur-xl`}
      >
        <h2 className="text-base font-semibold tracking-tight text-white" id={titleId}>
          Sync to Bitrix24?
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Selected tasks will be pushed to Bitrix24 using your project webhook. Continue?
        </p>
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <button
            className={`${WORKSPACE_GHOST_BTN_CLASS} px-3 py-1.5 text-sm`}
            disabled={pending}
            onClick={onCancel}
            type="button"
          >
            Cancel
          </button>
          <button
            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:opacity-60"
            disabled={pending}
            onClick={onConfirm}
            type="button"
          >
            {pending ? 'Syncing…' : 'Sync'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
