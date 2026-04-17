/**
 * Shared, isomorphic validation rules for project chat attachments.
 *
 * Used by:
 * - the upload API (server-side authoritative checks)
 * - the chat composer (client-side pre-flight to fail fast before upload)
 */

export type AttachmentFormat = 'md' | 'txt' | 'json' | 'yaml';

export const ATTACHMENT_MAX_BYTES = 1_048_576;

export const ATTACHMENT_MAX_PER_MESSAGE = 10;

/** Per-turn cap on injected attachment content to protect the LLM token budget. */
export const ATTACHMENT_CONTEXT_MAX_BYTES = 200_000;

export const ATTACHMENT_ALLOWED_EXTENSIONS = ['.md', '.txt', '.json', '.yaml', '.yml'] as const;

export const ATTACHMENT_ACCEPT_ATTRIBUTE = ATTACHMENT_ALLOWED_EXTENSIONS.join(',');

const EXTENSION_TO_FORMAT: Record<string, AttachmentFormat> = {
  '.md': 'md',
  '.txt': 'txt',
  '.json': 'json',
  '.yaml': 'yaml',
  '.yml': 'yaml',
};

export const ATTACHMENT_FORMAT_CONTENT_TYPE: Record<AttachmentFormat, string> = {
  md: 'text/markdown; charset=utf-8',
  txt: 'text/plain; charset=utf-8',
  json: 'application/json; charset=utf-8',
  yaml: 'application/yaml; charset=utf-8',
};

function getExtension(filename: string): string {
  const idx = filename.lastIndexOf('.');
  if (idx < 0) return '';
  return filename.slice(idx).toLowerCase();
}

export function inferAttachmentFormat(filename: string): AttachmentFormat | null {
  const ext = getExtension(filename);
  return EXTENSION_TO_FORMAT[ext] ?? null;
}

export type AttachmentValidationOk = { ok: true; format: AttachmentFormat };
export type AttachmentValidationErr = { ok: false; error: string };
export type AttachmentValidationResult = AttachmentValidationOk | AttachmentValidationErr;

/** Filename + size check; safe to run on `File` objects in the browser. */
export function validateAttachmentMetadata(input: {
  filename: string;
  sizeBytes: number;
}): AttachmentValidationResult {
  const format = inferAttachmentFormat(input.filename);
  if (!format) {
    return {
      ok: false,
      error: `Unsupported file type. Allowed: ${ATTACHMENT_ALLOWED_EXTENSIONS.join(', ')}`,
    };
  }
  if (input.sizeBytes <= 0) {
    return { ok: false, error: 'File is empty' };
  }
  if (input.sizeBytes > ATTACHMENT_MAX_BYTES) {
    return {
      ok: false,
      error: `File too large (max ${Math.round(ATTACHMENT_MAX_BYTES / 1024)} KB)`,
    };
  }
  return { ok: true, format };
}

const BINARY_SNIFF_WINDOW = 4096;

/**
 * Rejects obvious binary blobs by scanning the first 4 KB for NUL bytes — UTF-8
 * text never contains them, while images/exes/archives almost always do.
 */
export function isLikelyTextBytes(bytes: Uint8Array): boolean {
  const limit = Math.min(bytes.length, BINARY_SNIFF_WINDOW);
  for (let i = 0; i < limit; i += 1) {
    if (bytes[i] === 0) return false;
  }
  try {
    new TextDecoder('utf-8', { fatal: true }).decode(bytes.subarray(0, limit));
    return true;
  } catch {
    return false;
  }
}

/** Server-side authoritative check on already-buffered file bytes. */
export function validateAttachmentBytes(input: {
  filename: string;
  bytes: Uint8Array;
}): AttachmentValidationResult {
  const meta = validateAttachmentMetadata({
    filename: input.filename,
    sizeBytes: input.bytes.length,
  });
  if (!meta.ok) return meta;
  if (!isLikelyTextBytes(input.bytes)) {
    return { ok: false, error: 'File appears to be binary; only text files are allowed' };
  }
  return meta;
}
