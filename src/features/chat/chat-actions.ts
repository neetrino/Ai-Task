'use server';

import { revalidatePath } from 'next/cache';
import { revalidateProjectData } from '@/shared/lib/project-cache-tags';
import { PLAN_SYSTEM_PROMPT } from '@/features/chat/prompts';
import { normalizePlanFromAi, type PlanPayload } from '@/shared/domain/plan';
import { getOpenAI } from '@/shared/lib/openai';
import { logger } from '@/shared/lib/logger';
import { prisma } from '@/shared/lib/prisma';
import { getEffectiveChatModel } from '@/shared/lib/openai-model';
import { enforceRateLimit } from '@/shared/lib/rate-limit';
import { requireActiveUserId } from '@/shared/lib/session';

export async function sendChatMessage(
  projectId: string,
  phaseId: string | null,
  _prev: unknown,
  formData: FormData,
): Promise<{ error?: string } | void> {
  const userId = await requireActiveUserId();
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

  const revalidateProject = () => {
    revalidatePath(`/app/projects/${project.slug}`);
    revalidateProjectData(projectId);
  };

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
      revalidateProject();
      return { error: 'Empty AI response' };
    }
    rawJson = JSON.parse(content) as unknown;
  } catch (e) {
    logger.error({ err: e, projectId }, 'OpenAI chat failed');
    revalidateProject();
    return { error: 'AI request failed. Check OpenAI_API_Key and try again.' };
  }

  if (!rawJson || typeof rawJson !== 'object') {
    logger.warn({ rawJson }, 'AI chat JSON was not an object');
    revalidateProject();
    return { error: 'AI returned an invalid plan. Try rephrasing your message.' };
  }

  const body = rawJson as Record<string, unknown>;
  const rawAssistant = body.assistant_message;
  let assistant_message =
    typeof rawAssistant === 'string' && rawAssistant.trim()
      ? rawAssistant.trim()
      : 'Describe your goal when you are ready — I will turn it into epics and tasks.';

  const rawQuestions = body.open_questions;
  if (Array.isArray(rawQuestions) && rawQuestions.length > 0) {
    const questions = rawQuestions
      .filter((q): q is string => typeof q === 'string' && q.trim().length > 0)
      .map((q) => q.trim());
    if (questions.length > 0) {
      assistant_message = `${assistant_message}\n\n**Open questions**\n${questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}`;
    }
  }

  let plan: PlanPayload;
  try {
    plan = normalizePlanFromAi(body.plan, priorPlan);
  } catch (e) {
    logger.warn({ err: e, rawJson }, 'AI plan normalization failed');
    revalidateProject();
    return { error: 'AI returned an invalid plan. Try rephrasing your message.' };
  }

  await prisma.message.create({
    data: {
      projectId,
      phaseId,
      role: 'assistant',
      content: assistant_message,
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

  revalidateProject();
}
