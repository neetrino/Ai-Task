'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { AttachmentFormat } from '@/features/attachments/attachment-rules';
import { WORKSPACE_BODY_CLASS, WORKSPACE_GHOST_BTN_CLASS } from '@/shared/ui/workspace-ui';

type AttachmentRow = {
  id: string;
  filename: string;
  format: AttachmentFormat;
  sizeBytes: number;
  messageId: string | null;
  phaseId: string | null;
  createdAt: string;
};

type ListResponse = {
  attachments?: AttachmentRow[];
  error?: string;
};

const FORMAT_BADGE: Record<AttachmentFormat, string> = {
  md: 'MD',
  txt: 'TXT',
  json: 'JSON',
  yaml: 'YAML',
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(kb < 10 ? 1 : 0)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

export function ProjectAttachmentsList({
  projectSlug,
  /**
   * Bumped by the parent (e.g. on tab open or after a chat send) to force
   * a refetch without unmounting the component.
   */
  refreshKey = 0,
}: {
  projectSlug: string;
  refreshKey?: number;
}) {
  const [items, setItems] = useState<AttachmentRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(`/api/projects/${encodeURIComponent(projectSlug)}/attachments`, {
        cache: 'no-store',
      });
      const body = (await res.json()) as ListResponse;
      if (!res.ok || !body.attachments) {
        throw new Error(body.error ?? 'Failed to load attachments');
      }
      setItems(body.attachments);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load';
      setError(msg);
      setItems([]);
    }
  }, [projectSlug]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  const handleDelete = async (id: string) => {
    if (busyId) return;
    setBusyId(id);
    try {
      const res = await fetch(
        `/api/projects/${encodeURIComponent(projectSlug)}/attachments/${encodeURIComponent(id)}`,
        { method: 'DELETE' },
      );
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? 'Delete failed');
      }
      setItems((prev) => (prev ? prev.filter((a) => a.id !== id) : prev));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Delete failed';
      toast.error(msg);
    } finally {
      setBusyId(null);
    }
  };

  if (items === null && error === null) {
    return <p className={WORKSPACE_BODY_CLASS}>Loading…</p>;
  }
  if (error) {
    return (
      <div className="space-y-3">
        <p className={`${WORKSPACE_BODY_CLASS} text-red-300`}>{error}</p>
        <button className={WORKSPACE_GHOST_BTN_CLASS} onClick={() => void load()} type="button">
          Retry
        </button>
      </div>
    );
  }
  if (!items || items.length === 0) {
    return (
      <p className={WORKSPACE_BODY_CLASS}>
        No files yet. Drop a file into the chat or use the + button.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {items.map((a) => (
        <li
          className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-neutral-900/50 px-3 py-2"
          key={a.id}
        >
          <span
            aria-hidden
            className="inline-flex h-5 items-center justify-center rounded bg-white/[0.08] px-1.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-300"
          >
            {FORMAT_BADGE[a.format]}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-neutral-200" title={a.filename}>
              {a.filename}
            </p>
            <p className="text-[11px] text-neutral-500">
              {formatSize(a.sizeBytes)} · {formatDate(a.createdAt)}
              {a.messageId ? ' · attached' : ''}
            </p>
          </div>
          <a
            className={WORKSPACE_GHOST_BTN_CLASS}
            href={`/api/projects/${encodeURIComponent(projectSlug)}/attachments/${encodeURIComponent(a.id)}/content`}
            rel="noreferrer"
            target="_blank"
          >
            Open
          </a>
          <button
            className={WORKSPACE_GHOST_BTN_CLASS}
            disabled={busyId === a.id}
            onClick={() => void handleDelete(a.id)}
            type="button"
          >
            {busyId === a.id ? 'Removing…' : 'Delete'}
          </button>
        </li>
      ))}
    </ul>
  );
}
