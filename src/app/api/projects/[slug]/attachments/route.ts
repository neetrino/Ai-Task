import { NextRequest } from 'next/server';
import { createHash, randomUUID } from 'node:crypto';
import {
  ATTACHMENT_FORMAT_CONTENT_TYPE,
  ATTACHMENT_MAX_BYTES,
  validateAttachmentBytes,
} from '@/features/attachments/attachment-rules';
import { logger } from '@/shared/lib/logger';
import { prisma } from '@/shared/lib/prisma';
import { enforceRateLimit } from '@/shared/lib/rate-limit';
import { buildAttachmentObjectKey, putAttachmentObject } from '@/shared/lib/r2';
import { requireActiveUserForApi } from '@/shared/lib/session';

const MULTIPART_BOUNDARY_HINT = 'multipart/form-data';

type ProjectRowForAttachments = { id: string };

async function loadOwnedProject(
  slug: string,
  userId: string,
): Promise<ProjectRowForAttachments | null> {
  return prisma.project.findFirst({
    where: { slug, ownerId: userId },
    select: { id: true },
  });
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ slug: string }> },
): Promise<Response> {
  const authResult = await requireActiveUserForApi();
  if ('error' in authResult) return authResult.error;
  const { userId } = authResult;
  const { slug } = await context.params;

  const project = await loadOwnedProject(slug, userId);
  if (!project) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  const rows = await prisma.projectAttachment.findMany({
    where: { projectId: project.id },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      filename: true,
      format: true,
      sizeBytes: true,
      messageId: true,
      phaseId: true,
      createdAt: true,
    },
  });

  return Response.json({ attachments: rows }, { status: 200 });
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> },
): Promise<Response> {
  const authResult = await requireActiveUserForApi();
  if ('error' in authResult) return authResult.error;
  const { userId } = authResult;
  const { slug } = await context.params;

  const contentType = req.headers.get('content-type') ?? '';
  if (!contentType.toLowerCase().includes(MULTIPART_BOUNDARY_HINT)) {
    return Response.json({ error: 'Expected multipart/form-data' }, { status: 415 });
  }

  try {
    await enforceRateLimit(`attachments:${userId}`);
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'Rate limited' },
      { status: 429 },
    );
  }

  const project = await loadOwnedProject(slug, userId);
  if (!project) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return Response.json({ error: 'Invalid multipart payload' }, { status: 400 });
  }

  const file = form.get('file');
  if (!(file instanceof File)) {
    return Response.json({ error: 'Missing "file" field' }, { status: 400 });
  }
  if (file.size > ATTACHMENT_MAX_BYTES) {
    return Response.json(
      { error: `File too large (max ${Math.round(ATTACHMENT_MAX_BYTES / 1024)} KB)` },
      { status: 413 },
    );
  }

  const phaseIdRaw = form.get('phaseId');
  const phaseId = typeof phaseIdRaw === 'string' && phaseIdRaw.length > 0 ? phaseIdRaw : null;
  if (phaseId) {
    const phase = await prisma.phase.findFirst({
      where: { id: phaseId, projectId: project.id },
      select: { id: true },
    });
    if (!phase) {
      return Response.json({ error: 'Phase not found' }, { status: 404 });
    }
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const validation = validateAttachmentBytes({ filename: file.name, bytes });
  if (!validation.ok) {
    return Response.json({ error: validation.error }, { status: 400 });
  }

  const attachmentId = `att_${randomUUID().replace(/-/g, '')}`;
  const r2Key = buildAttachmentObjectKey({
    projectId: project.id,
    attachmentId,
    filename: file.name,
  });
  const sha256 = createHash('sha256').update(bytes).digest('hex');

  try {
    await putAttachmentObject({
      key: r2Key,
      body: bytes,
      contentType: ATTACHMENT_FORMAT_CONTENT_TYPE[validation.format],
    });
  } catch (err) {
    logger.error({ err, slug }, 'R2 upload failed');
    return Response.json({ error: 'Storage upload failed' }, { status: 502 });
  }

  const row = await prisma.projectAttachment.create({
    data: {
      id: attachmentId,
      projectId: project.id,
      phaseId,
      uploadedById: userId,
      filename: file.name,
      format: validation.format,
      sizeBytes: bytes.length,
      r2Key,
      sha256,
    },
    select: {
      id: true,
      filename: true,
      format: true,
      sizeBytes: true,
      createdAt: true,
    },
  });

  return Response.json({ attachment: row }, { status: 201 });
}
