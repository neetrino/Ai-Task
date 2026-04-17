import { NextRequest } from 'next/server';
import { logger } from '@/shared/lib/logger';
import { prisma } from '@/shared/lib/prisma';
import { deleteAttachmentObject } from '@/shared/lib/r2';
import { requireActiveUserForApi } from '@/shared/lib/session';

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ slug: string; id: string }> },
): Promise<Response> {
  const authResult = await requireActiveUserForApi();
  if ('error' in authResult) return authResult.error;
  const { userId } = authResult;
  const { slug, id } = await context.params;

  const attachment = await prisma.projectAttachment.findFirst({
    where: { id, project: { slug, ownerId: userId } },
    select: { id: true, r2Key: true },
  });
  if (!attachment) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    await deleteAttachmentObject(attachment.r2Key);
  } catch (err) {
    // Object may already be gone (manual cleanup, R2 retention, etc.); log and proceed
    // so the user-facing row is still removed and the UI stays consistent.
    logger.warn({ err, key: attachment.r2Key }, 'R2 delete failed, removing DB row anyway');
  }

  await prisma.projectAttachment.delete({ where: { id: attachment.id } });

  return Response.json({ ok: true }, { status: 200 });
}
