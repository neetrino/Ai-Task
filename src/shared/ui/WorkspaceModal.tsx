'use client';

import { useEffect, useId, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

export function WorkspaceModal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const titleId = useId();
  const [mounted, setMounted] = useState(false);

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

  return createPortal(
    <div
      aria-labelledby={titleId}
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
    >
      <button
        aria-label="Close dialog"
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
        onClick={onClose}
        type="button"
      />
      <div className="relative z-[101] max-h-[min(90vh,720px)] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-slate-950/95 p-5 shadow-2xl shadow-black/60 ring-1 ring-white/5 backdrop-blur-xl">
        <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3">
          <h2 className="text-base font-semibold tracking-tight text-white" id={titleId}>
            {title}
          </h2>
          <button
            className="shrink-0 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-slate-300 transition hover:border-white/25 hover:bg-white/10 hover:text-white"
            onClick={onClose}
            type="button"
          >
            Close
          </button>
        </div>
        <div className="pt-4">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
