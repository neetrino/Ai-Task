'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { PLAN_SYSTEM_PROMPT } from '@/features/chat/prompts';
import { planSchema, type PlanPayload } from '@/shared/domain/plan';
import { getOpenAI } from '@/shared/lib/openai';
import { logger } from '@/shared/lib/logger';
import { prisma } from '@/shared/lib/prisma';
import { getEffectiveChatModel } from '@/shared/lib/openai-model';
import { enforceRateLimit } from '@/shared/lib/rate-limit';
import { requireSessionUserId } from '@/shared/lib/session';

const chatResponseSchema = z.object({
  assistant_message: z.string(),
  plan: planSchema,
});

export async function sendChatMessage(
  projectId: string,
  phaseId: string | null,
  _prev: unknown,
  formData: FormData,
): Promise<{ error?: string } | void> {
  const userId = await requireSessionUserId();
  await enforceRateLimit(`chat:${userId}`);

  const text = formData.get('message');
  const pasted = formData.get('pastedContext');
  if (typeof text !== 'string' || !text.trim()) {
    return { error: 'Message is required' };
  }

  let composed = text.trim();
  if (typeof pasted === 'string' && pasted.trim()) {
    composed = `${composed}\n\n---\nAttached context:\n${pasted.trim()}`;
  }

  const project = await prisma.project.findFirst({
    where: { id: projectId, ownerId: userId },
  });
  if (!project) {
    return { error: 'Project not found' };
  }

  if (phaseId) {
    const phase = await prisma.phase.findFirst({
      where: { id: phaseId, projectId },
    });
    if (!phase) {
      return { error: 'Phase not found' };
    }
  }

  await prisma.message.create({
    data: {
      projectId,
      phaseId,
      role: 'user',
      content: composed,
    },
  });

  const history = await prisma.message.findMany({
    where: { projectId, phaseId },
    orderBy: { createdAt: 'asc' },
    take: 40,
  });

  const latestSnapshot = await prisma.planSnapshot.findFirst({
    where: { projectId, phaseId },
    orderBy: { updatedAt: 'desc' },
  });

  const priorPlan = latestSnapshot?.payload as PlanPayload | undefined;

  const systemContent = priorPlan
    ? `${PLAN_SYSTEM_PROMPT}\n\nCurrent plan JSON:\n${JSON.stringify(priorPlan)}`
    : PLAN_SYSTEM_PROMPT;

  const messages = [
    { role: 'system' as const, content: systemContent },
    ...history.map((m) => ({
      role: m.role === 'user' ? ('user' as const) : ('assistant' as const),
      content: m.content,
    })),
  ];

  const model = getEffectiveChatModel(project);

  let rawJson: unknown;
  try {
    const completion = await getOpenAI().chat.completions.create({
      model,
      response_format: { type: 'json_object' },
      messages,
    });
    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return { error: 'Empty AI response' };
    }
    rawJson = JSON.parse(content) as unknown;
  } catch (e) {
    logger.error({ err: e, projectId }, 'OpenAI chat failed');
    return { error: 'AI request failed. Check OpenAI_API_Key and try again.' };
  }

  let parsed: z.infer<typeof chatResponseSchema>;
  try {
    parsed = chatResponseSchema.parse(rawJson);
  } catch (e) {
    logger.warn({ err: e, rawJson }, 'AI plan JSON validation failed');
    return { error: 'AI returned an invalid plan. Try rephrasing your message.' };
  }

  const plan = parsed.plan;

  await prisma.message.create({
    data: {
      projectId,
      phaseId,
      role: 'assistant',
      content: parsed.assistant_message,
    },
  });

  await prisma.planSnapshot.create({
    data: {
      projectId,
      phaseId,
      payload: plan as object,
      version: (latestSnapshot?.version ?? 0) + 1,
    },
  });

  revalidatePath(`/app/projects/${project.slug}`);
}
