'use client';

import type { AttachmentDraft } from '@/features/chat/attachment-uploads';

const FORMAT_BADGE: Record<AttachmentDraft['format'], string> = {
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

export function AttachmentChip({
  draft,
  onRemove,
}: {
  draft: AttachmentDraft;
  onRemove: () => void;
}) {
  const isError = draft.status === 'error';
  const isUploading = draft.status === 'uploading';

  return (
    <div
      className={`group inline-flex max-w-full items-center gap-2 rounded-full border px-2.5 py-1 text-xs ${
        isError
          ? 'border-red-500/40 bg-red-500/[0.08] text-red-200'
          : 'border-white/[0.08] bg-neutral-900/60 text-neutral-200'
      }`}
      title={isError && draft.error ? draft.error : draft.filename}
    >
      <span
        aria-hidden
        className="inline-flex h-4 items-center justify-center rounded bg-white/[0.08] px-1 text-[10px] font-semibold uppercase tracking-wide text-neutral-300"
      >
        {FORMAT_BADGE[draft.format]}
      </span>
      <span className="max-w-[14rem] truncate">{draft.filename}</span>
      {isUploading ? (
        <span aria-hidden className="h-2 w-2 animate-pulse rounded-full bg-neutral-400" />
      ) : (
        <span className="text-neutral-500">{formatSize(draft.sizeBytes)}</span>
      )}
      <button
        aria-label={`Remove ${draft.filename}`}
        className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full text-neutral-400 transition hover:bg-white/[0.08] hover:text-neutral-100"
        onClick={onRemove}
        type="button"
      >
        <svg aria-hidden className="h-3 w-3" fill="none" viewBox="0 0 24 24">
          <path
            d="M6 6l12 12M18 6L6 18"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="2"
          />
        </svg>
      </button>
    </div>
  );
}
