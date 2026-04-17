'use client';

import {
  ATTACHMENT_MAX_PER_MESSAGE,
  type AttachmentFormat,
  validateAttachmentMetadata,
} from '@/features/attachments/attachment-rules';

export type AttachmentDraftStatus = 'uploading' | 'ready' | 'error';

export type AttachmentDraft = {
  localId: string;
  filename: string;
  format: AttachmentFormat;
  sizeBytes: number;
  status: AttachmentDraftStatus;
  /** Server-issued attachment id; populated after a successful upload. */
  serverId?: string;
  error?: string;
};

export type UploadAttachmentResponseJson = {
  attachment?: { id: string };
  error?: string;
};

export class AttachmentLimitError extends Error {
  constructor() {
    super(`You can attach at most ${ATTACHMENT_MAX_PER_MESSAGE} files per message`);
    this.name = 'AttachmentLimitError';
  }
}

export async function uploadAttachment(params: {
  projectSlug: string;
  file: File;
  phaseId: string | null;
  signal: AbortSignal;
}): Promise<{ id: string }> {
  const { projectSlug, file, phaseId, signal } = params;
  const form = new FormData();
  form.append('file', file);
  if (phaseId) {
    form.append('phaseId', phaseId);
  }
  const url = `/api/projects/${encodeURIComponent(projectSlug)}/attachments`;
  const res = await fetch(url, { method: 'POST', body: form, signal });
  let body: UploadAttachmentResponseJson;
  try {
    body = (await res.json()) as UploadAttachmentResponseJson;
  } catch {
    throw new Error('Upload failed (invalid server response)');
  }
  if (!res.ok || !body.attachment) {
    throw new Error(body.error ?? 'Upload failed');
  }
  return { id: body.attachment.id };
}

export async function deleteAttachment(params: {
  projectSlug: string;
  attachmentId: string;
}): Promise<void> {
  const { projectSlug, attachmentId } = params;
  const url = `/api/projects/${encodeURIComponent(projectSlug)}/attachments/${encodeURIComponent(attachmentId)}`;
  const res = await fetch(url, { method: 'DELETE' });
  if (!res.ok) {
    let message = 'Delete failed';
    try {
      const body = (await res.json()) as { error?: string };
      if (body.error) message = body.error;
    } catch {
      // ignore — fall through to generic message
    }
    throw new Error(message);
  }
}

/** Pre-flight metadata check used before kicking off an upload. */
export function precheckFile(file: File): { ok: true; format: AttachmentFormat } | { ok: false; error: string } {
  return validateAttachmentMetadata({ filename: file.name, sizeBytes: file.size });
}
