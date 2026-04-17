import { NextRequest } from 'next/server';
import { z } from 'zod';
import { ATTACHMENT_MAX_PER_MESSAGE } from '@/features/attachments/attachment-rules';
import { runProjectChatTurn } from '@/features/chat/project-chat-turn';
import { prisma } from '@/shared/lib/prisma';
import { requireActiveUserForApi } from '@/shared/lib/session';

const CHAT_MESSAGE_MAX_LEN = 100_000;

const chatPostBodySchema = z.object({
  message: z.string().max(CHAT_MESSAGE_MAX_LEN),
  phaseId: z.union([z.string().min(1), z.null()]).optional(),
  attachmentIds: z.array(z.string().min(1)).max(ATTACHMENT_MAX_PER_MESSAGE).optional(),
});

function httpStatusForChatError(error: string): number {
  if (error === 'Project not found' || error === 'Phase not found') return 404;
  return 422;
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> },
): Promise<Response> {
  const authResult = await requireActiveUserForApi();
  if ('error' in authResult) {
    return authResult.error;
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = chatPostBodySchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: 'Invalid body' }, { status: 400 });
  }

  const composed = parsed.data.message.trim();
  if (!composed) {
    return Response.json({ error: 'Message is required' }, { status: 400 });
  }

  const { slug } = await context.params;
  const { userId } = authResult;

  const project = await prisma.project.findFirst({
    where: { slug, ownerId: userId },
    select: { id: true, slug: true, openaiChatModel: true },
  });
  if (!project) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  const phaseId = parsed.data.phaseId ?? null;

  const result = await runProjectChatTurn({
    userId,
    projectId: project.id,
    phaseId,
    message: composed,
    signal: req.signal,
    project,
    attachmentIds: parsed.data.attachmentIds,
  });

  if (result && 'cancelled' in result) {
    return Response.json({ cancelled: true }, { status: 200 });
  }
  if (result && 'error' in result) {
    return Response.json(
      { error: result.error },
      { status: httpStatusForChatError(result.error) },
    );
  }
  return Response.json({ ok: true }, { status: 200 });
}
