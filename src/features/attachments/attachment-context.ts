import {
  ATTACHMENT_CONTEXT_MAX_BYTES,
  type AttachmentFormat,
} from '@/features/attachments/attachment-rules';
import { logger } from '@/shared/lib/logger';
import { prisma } from '@/shared/lib/prisma';
import { getAttachmentObject } from '@/shared/lib/r2';

const TRUNCATION_MARKER = '\n[truncated]';

const FORMAT_FENCE_TAG: Record<AttachmentFormat, string> = {
  md: 'md',
  txt: 'text',
  json: 'json',
  yaml: 'yaml',
};

type LoadedAttachment = {
  id: string;
  filename: string;
  format: AttachmentFormat;
  sizeBytes: number;
  text: string;
};

export type ComposedAttachmentBlock = {
  /** Final user-message content with file blocks prefixed. */
  composedContent: string;
  /** Ids that were actually loaded and embedded; safe to link to the persisted message. */
  resolvedAttachmentIds: string[];
};

function decodeBytes(bytes: Uint8Array): string {
  return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
}

/**
 * Allocates the per-turn byte budget across loaded attachments proportionally
 * so a single huge file can't crowd out smaller siblings; truncated files get
 * a `[truncated]` marker so the LLM knows the input is partial.
 */
function applyContextBudget(loaded: LoadedAttachment[]): LoadedAttachment[] {
  const totalSize = loaded.reduce((acc, a) => acc + a.sizeBytes, 0);
  if (totalSize <= ATTACHMENT_CONTEXT_MAX_BYTES) return loaded;

  return loaded.map((a) => {
    const share = Math.floor(
      (a.sizeBytes / totalSize) * ATTACHMENT_CONTEXT_MAX_BYTES,
    );
    if (a.text.length <= share) return a;
    return {
      ...a,
      text: a.text.slice(0, Math.max(0, share - TRUNCATION_MARKER.length)) + TRUNCATION_MARKER,
    };
  });
}

function renderBlock(att: LoadedAttachment): string {
  const fence = FORMAT_FENCE_TAG[att.format];
  return [
    `[${att.filename}] (${att.format}, ${att.sizeBytes} bytes)`,
    '```' + fence,
    att.text,
    '```',
  ].join('\n');
}

/**
 * Fetches the listed attachments from R2 (after verifying they belong to the
 * project), then returns a user-message string with file blocks prefixed
 * before the original message text. Bad ids are silently skipped.
 */
export async function composeUserMessageWithAttachments(params: {
  projectId: string;
  attachmentIds: string[];
  message: string;
}): Promise<ComposedAttachmentBlock> {
  const { projectId, attachmentIds, message } = params;
  if (attachmentIds.length === 0) {
    return { composedContent: message, resolvedAttachmentIds: [] };
  }

  const rows = await prisma.projectAttachment.findMany({
    where: { id: { in: attachmentIds }, projectId },
    select: {
      id: true,
      filename: true,
      format: true,
      sizeBytes: true,
      r2Key: true,
    },
  });
  if (rows.length === 0) {
    return { composedContent: message, resolvedAttachmentIds: [] };
  }

  const loaded: LoadedAttachment[] = [];
  for (const row of rows) {
    try {
      const bytes = await getAttachmentObject(row.r2Key);
      loaded.push({
        id: row.id,
        filename: row.filename,
        format: row.format,
        sizeBytes: bytes.length,
        text: decodeBytes(bytes),
      });
    } catch (err) {
      logger.warn(
        { err, attachmentId: row.id },
        'Failed to load attachment from R2; skipping',
      );
    }
  }
  if (loaded.length === 0) {
    return { composedContent: message, resolvedAttachmentIds: [] };
  }

  const budgeted = applyContextBudget(loaded);
  const blocks = budgeted.map(renderBlock).join('\n\n');
  const composedContent = `<attachments>\n${blocks}\n</attachments>\n\n<user_message>\n${message}\n</user_message>`;

  return {
    composedContent,
    resolvedAttachmentIds: loaded.map((a) => a.id),
  };
}
