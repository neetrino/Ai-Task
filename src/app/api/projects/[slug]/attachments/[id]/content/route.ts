import { NextRequest } from 'next/server';
import { ATTACHMENT_FORMAT_CONTENT_TYPE } from '@/features/attachments/attachment-rules';
import { logger } from '@/shared/lib/logger';
import { prisma } from '@/shared/lib/prisma';
import { getAttachmentObject } from '@/shared/lib/r2';
import { requireActiveUserForApi } from '@/shared/lib/session';

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ slug: string; id: string }> },
): Promise<Response> {
  const authResult = await requireActiveUserForApi();
  if ('error' in authResult) return authResult.error;
  const { userId } = authResult;
  const { slug, id } = await context.params;

  const attachment = await prisma.projectAttachment.findFirst({
    where: { id, project: { slug, ownerId: userId } },
    select: { r2Key: true, filename: true, format: true },
  });
  if (!attachment) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  let bytes: Uint8Array;
  try {
    bytes = await getAttachmentObject(attachment.r2Key);
  } catch (err) {
    logger.error({ err, key: attachment.r2Key }, 'R2 read failed');
    return Response.json({ error: 'Storage read failed' }, { status: 502 });
  }

  // Copy into a fresh ArrayBuffer so the Response body type matches BodyInit
  // (Uint8Array backed by SharedArrayBuffer is not assignable under TS strict).
  const copy = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(copy).set(bytes);
  return new Response(copy, {
    headers: {
      'Content-Type': ATTACHMENT_FORMAT_CONTENT_TYPE[attachment.format],
      'Content-Disposition': `inline; filename="${attachment.filename.replace(/"/g, '')}"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
