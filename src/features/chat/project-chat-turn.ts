import { revalidatePath } from 'next/cache';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { APIUserAbortError } from 'openai/error';
import { CHAT_MODEL_HISTORY_LIMIT } from '@/features/chat/chat-limits';
import { PLAN_SYSTEM_PROMPT } from '@/features/chat/prompts';
import { normalizePlanFromAi, type PlanPayload } from '@/shared/domain/plan';
import { getOpenAI } from '@/shared/lib/openai';
import { getEffectiveChatModel } from '@/shared/lib/openai-model';
import { logger } from '@/shared/lib/logger';
import { prisma } from '@/shared/lib/prisma';
import { enforceRateLimit } from '@/shared/lib/rate-limit';
import { revalidateProjectData } from '@/shared/lib/project-cache-tags';

export type RunProjectChatTurnResult =
  | undefined
  | { error: string }
  | { cancelled: true };

type ProjectForChatModel = Parameters<typeof getEffectiveChatModel>[0] & {
  id: string;
  slug: string;
};

export type RunProjectChatTurnParams = {
  userId: string;
  projectId: string;
  phaseId: string | null;
  message: string;
  signal?: AbortSignal;
  /**
   * Pre-loaded project row. When provided, skips the duplicate
   * `project.findFirst` inside the preflight (the caller already verified
   * ownership by slug). Falls back to an id/ownerId lookup when omitted.
   */
  project?: ProjectForChatModel;
};

type PlanSnapshotRow = { version: number; payload: unknown } | null;

function isCancellationError(err: unknown): boolean {
  if (err instanceof APIUserAbortError) return true;
  if (err instanceof Error && err.name === 'AbortError') return true;
  return false;
}

function buildAssistantTextFromJsonBody(body: Record<string, unknown>): string {
  const rawAssistant = body.assistant_message;
  const text =
    typeof rawAssistant === 'string' && rawAssistant.trim()
      ? rawAssistant.trim()
      : 'Describe your goal when you are ready — I will turn it into epics and tasks.';

  const rawQuestions = body.open_questions;
  if (!Array.isArray(rawQuestions) || rawQuestions.length === 0) {
    return text;
  }
  const questions = rawQuestions
    .filter((q): q is string => typeof q === 'string' && q.trim().length > 0)
    .map((q) => q.trim());
  if (questions.length === 0) {
    return text;
  }
  return `${text}\n\n**Open questions**\n${questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}`;
}

function buildChatCompletionMessages(
  history: { role: string; content: string }[],
  priorPlan: PlanPayload | undefined,
): ChatCompletionMessageParam[] {
  const systemContent = priorPlan
    ? `${PLAN_SYSTEM_PROMPT}\n\nCurrent plan JSON:\n${JSON.stringify(priorPlan)}`
    : PLAN_SYSTEM_PROMPT;

  return [
    { role: 'system', content: systemContent },
    ...history.map((m) => ({
      role: m.role === 'user' ? ('user' as const) : ('assistant' as const),
      content: m.content,
    })),
  ];
}

async function loadOpenAiMessagesAndModel(
  project: ProjectForChatModel,
  projectId: string,
  phaseId: string | null,
): Promise<{
  messages: ChatCompletionMessageParam[];
  model: string;
  latestSnapshot: PlanSnapshotRow;
  priorPlan: PlanPayload | undefined;
}> {
  // Parallel: history and latest snapshot are independent reads. Newest
  // `CHAT_MODEL_HISTORY_LIMIT` rows are fetched desc and reversed so the LLM
  // sees ascending chronological order without dropping recent messages.
  const [historyDesc, latestSnapshot] = await Promise.all([
    prisma.message.findMany({
      where: { projectId, phaseId },
      orderBy: { createdAt: 'desc' },
      take: CHAT_MODEL_HISTORY_LIMIT,
      select: { role: true, content: true },
    }),
    prisma.planSnapshot.findFirst({
      where: { projectId, phaseId },
      orderBy: { updatedAt: 'desc' },
      select: { version: true, payload: true },
    }),
  ]);

  const history = historyDesc.reverse();
  const priorPlan = latestSnapshot?.payload as PlanPayload | undefined;
  const messages = buildChatCompletionMessages(history, priorPlan);
  const model = getEffectiveChatModel(project);
  return { messages, model, latestSnapshot, priorPlan };
}

type OpenAiJsonOutcome =
  | { kind: 'success'; rawJson: unknown }
  | { kind: 'cancelled' }
  | { kind: 'error'; message: string };

async function requestPlanJsonFromOpenAi(
  model: string,
  messages: ChatCompletionMessageParam[],
  signal: AbortSignal | undefined,
  projectId: string,
): Promise<OpenAiJsonOutcome> {
  // Note: preflight already revalidated project data after saving the user
  // message, so OpenAI failure/cancel branches do not need to invalidate the
  // cache again. Blowing cache tags on transient AI errors made every retry
  // pay the full RSC refetch cost on the next navigation.
  try {
    const completion = await getOpenAI().chat.completions.create(
      {
        model,
        response_format: { type: 'json_object' },
        messages,
      },
      { signal },
    );
    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return { kind: 'error', message: 'Empty AI response' };
    }
    return { kind: 'success', rawJson: JSON.parse(content) as unknown };
  } catch (e) {
    if (isCancellationError(e)) {
      return { kind: 'cancelled' };
    }
    logger.error({ err: e, projectId }, 'OpenAI chat failed');
    return { kind: 'error', message: 'AI request failed. Check OpenAI_API_Key and try again.' };
  }
}

type PreflightOk = {
  project: ProjectForChatModel;
  revalidateProject: () => void;
};

async function runChatPreflight(
  params: RunProjectChatTurnParams,
): Promise<{ error: string } | PreflightOk> {
  const { userId, projectId, phaseId, message, project: preloadedProject } = params;
  const composed = message.trim();

  if (!composed) {
    return { error: 'Message is required' };
  }

  await enforceRateLimit(`chat:${userId}`);

  // Reuse the project already loaded by the caller (e.g. the chat API route)
  // to avoid a second `project.findFirst` on the same request.
  const project =
    preloadedProject ??
    (await prisma.project.findFirst({
      where: { id: projectId, ownerId: userId },
    }));
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

  const now = new Date();
  if (phaseId) {
    await prisma.phase.updateMany({
      where: { id: phaseId, projectId },
      data: { lastUsedAt: now },
    });
  } else {
    await prisma.project.update({
      where: { id: projectId },
      data: { mainLastUsedAt: now },
    });
  }

  // Revalidate eagerly so any subsequent `router.refresh()` (success, error
  // or abort path) surfaces the newly persisted user message.
  revalidateProject();

  return { project, revalidateProject };
}

async function persistAssistantPlanFromJson(
  rawJson: unknown,
  projectId: string,
  phaseId: string | null,
  latestSnapshot: PlanSnapshotRow,
  priorPlan: PlanPayload | undefined,
  revalidateProject: () => void,
): Promise<{ error: string } | undefined> {
  if (!rawJson || typeof rawJson !== 'object') {
    logger.warn({ rawJson }, 'AI chat JSON was not an object');
    return { error: 'AI returned an invalid plan. Try rephrasing your message.' };
  }

  const body = rawJson as Record<string, unknown>;
  const assistant_message = buildAssistantTextFromJsonBody(body);

  let plan: PlanPayload;
  try {
    plan = normalizePlanFromAi(body.plan, priorPlan);
  } catch (e) {
    logger.warn({ err: e, rawJson }, 'AI plan normalization failed');
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

/**
 * Persists the user message, calls OpenAI to update the plan, persists assistant reply.
 * Pass `signal` (e.g. `req.signal`) to cancel the OpenAI request when the client aborts.
 */
export async function runProjectChatTurn(
  params: RunProjectChatTurnParams,
): Promise<RunProjectChatTurnResult> {
  const { projectId, phaseId, signal } = params;

  const preflight = await runChatPreflight(params);
  if ('error' in preflight) {
    return { error: preflight.error };
  }

  const { project, revalidateProject } = preflight;

  const { messages, model, latestSnapshot, priorPlan } = await loadOpenAiMessagesAndModel(
    project,
    projectId,
    phaseId,
  );

  const openAiOutcome = await requestPlanJsonFromOpenAi(model, messages, signal, projectId);

  if (openAiOutcome.kind === 'cancelled') {
    return { cancelled: true };
  }
  if (openAiOutcome.kind === 'error') {
    return { error: openAiOutcome.message };
  }

  const persistError = await persistAssistantPlanFromJson(
    openAiOutcome.rawJson,
    projectId,
    phaseId,
    latestSnapshot,
    priorPlan,
    revalidateProject,
  );
  if (persistError) {
    return persistError;
  }
}
