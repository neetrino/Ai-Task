import { revalidatePath } from 'next/cache';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { APIUserAbortError } from 'openai/error';
import { composeUserMessageWithAttachments } from '@/features/attachments/attachment-context';
import {
  buildProfile,
  type ContextProfileId,
  getHistoryLimitForProfile,
  type ProfileBuildResult,
} from '@/features/chat/profiles';
import { loadBudgetSnapshot, recordUsage } from '@/features/billing/token-budget';
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

/** Concrete model id chosen by the router for this turn. */
export type ChatTurnModelOverride = {
  readonly modelId: string;
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
  /** Attachment ids previously uploaded for this turn; embedded into the user message. */
  attachmentIds?: string[];
  /**
   * Which context profile to use. Defaults to `plan` for backward
   * compatibility while the smart router is being wired up. The router (Étape
   * 4) will pick this from request signals.
   */
  contextProfile?: ContextProfileId;
  /**
   * Concrete model id selected by the router. When omitted, the legacy
   * `getEffectiveChatModel` path is used (project's stored model or default).
   */
  modelOverride?: ChatTurnModelOverride;
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

async function loadOpenAiMessagesAndModel(
  project: ProjectForChatModel,
  projectId: string,
  phaseId: string | null,
  contextProfile: ContextProfileId,
  modelOverride: ChatTurnModelOverride | undefined,
): Promise<{
  built: ProfileBuildResult;
  model: string;
  latestSnapshot: PlanSnapshotRow;
  priorPlan: PlanPayload | undefined;
}> {
  const historyLimit = getHistoryLimitForProfile(contextProfile);
  // Parallel: history and latest snapshot are independent reads. Newest
  // `historyLimit` rows are fetched desc and reversed so the LLM sees
  // ascending chronological order without dropping recent messages.
  const [historyDesc, latestSnapshot] = await Promise.all([
    prisma.message.findMany({
      where: { projectId, phaseId },
      orderBy: { createdAt: 'desc' },
      take: historyLimit,
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
  const built = buildProfile(contextProfile, { history, priorPlan });
  const model = modelOverride?.modelId ?? getEffectiveChatModel(project);
  return { built, model, latestSnapshot, priorPlan };
}

type OpenAiCallOutcome =
  | {
      kind: 'success';
      rawText: string;
      promptTokens: number;
      completionTokens: number;
    }
  | { kind: 'cancelled' }
  | { kind: 'error'; message: string };

async function requestAssistantReplyFromOpenAi(
  model: string,
  built: ProfileBuildResult,
  signal: AbortSignal | undefined,
  projectId: string,
): Promise<OpenAiCallOutcome> {
  // Note: preflight already revalidated project data after saving the user
  // message, so OpenAI failure/cancel branches do not need to invalidate the
  // cache again. Blowing cache tags on transient AI errors made every retry
  // pay the full RSC refetch cost on the next navigation.
  try {
    const messages: ChatCompletionMessageParam[] = built.messages;
    const completion = await getOpenAI().chat.completions.create(
      {
        model,
        messages,
        ...(built.responseFormat ? { response_format: built.responseFormat } : {}),
      },
      { signal },
    );
    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return { kind: 'error', message: 'Empty AI response' };
    }
    return {
      kind: 'success',
      rawText: content,
      promptTokens: completion.usage?.prompt_tokens ?? 0,
      completionTokens: completion.usage?.completion_tokens ?? 0,
    };
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
  const {
    userId,
    projectId,
    phaseId,
    message,
    project: preloadedProject,
    attachmentIds,
  } = params;
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

  const { composedContent, resolvedAttachmentIds } = await composeUserMessageWithAttachments({
    projectId,
    attachmentIds: attachmentIds ?? [],
    message: composed,
  });

  const userMessage = await prisma.message.create({
    data: {
      projectId,
      phaseId,
      role: 'user',
      content: composedContent,
    },
    select: { id: true },
  });

  if (resolvedAttachmentIds.length > 0) {
    // Link attachments to the persisted message so the Files panel can show
    // "sent in message X". Done after create so we have the message id.
    await prisma.projectAttachment.updateMany({
      where: { id: { in: resolvedAttachmentIds }, projectId },
      data: { messageId: userMessage.id },
    });
  }

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

type PersistMeta = {
  readonly modelId: string;
  readonly tokensUsed: number;
};

async function persistAssistantPlanFromJson(
  rawJson: unknown,
  projectId: string,
  phaseId: string | null,
  latestSnapshot: PlanSnapshotRow,
  priorPlan: PlanPayload | undefined,
  meta: PersistMeta,
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
      modelId: meta.modelId,
      contextProfile: 'plan',
      tokensUsed: meta.tokensUsed,
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

async function persistAssistantTextReply(
  rawText: string,
  projectId: string,
  phaseId: string | null,
  contextProfile: ContextProfileId,
  meta: PersistMeta,
  revalidateProject: () => void,
): Promise<void> {
  await prisma.message.create({
    data: {
      projectId,
      phaseId,
      role: 'assistant',
      content: rawText.trim(),
      modelId: meta.modelId,
      contextProfile,
      tokensUsed: meta.tokensUsed,
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
  const {
    userId,
    projectId,
    phaseId,
    signal,
    contextProfile = 'plan',
    modelOverride,
  } = params;

  // Budget guard runs *before* preflight persists the user message — over-cap
  // users get a clean rejection without polluting the chat history.
  const budget = await loadBudgetSnapshot({ userId, projectId });
  if (budget.blocked) {
    return {
      error:
        'Monthly token budget reached. Increase the limit or wait for the next period.',
    };
  }

  const preflight = await runChatPreflight(params);
  if ('error' in preflight) {
    return { error: preflight.error };
  }

  const { project, revalidateProject } = preflight;

  const { built, model, latestSnapshot, priorPlan } = await loadOpenAiMessagesAndModel(
    project,
    projectId,
    phaseId,
    contextProfile,
    modelOverride,
  );

  const openAiOutcome = await requestAssistantReplyFromOpenAi(model, built, signal, projectId);

  if (openAiOutcome.kind === 'cancelled') {
    return { cancelled: true };
  }
  if (openAiOutcome.kind === 'error') {
    return { error: openAiOutcome.message };
  }

  const tokensUsed = openAiOutcome.promptTokens + openAiOutcome.completionTokens;
  const meta: PersistMeta = { modelId: model, tokensUsed };

  if (built.persistsPlan) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(openAiOutcome.rawText);
    } catch (e) {
      logger.warn({ err: e }, 'AI chat JSON parse failed');
      return { error: 'AI returned an invalid plan. Try rephrasing your message.' };
    }
    const persistError = await persistAssistantPlanFromJson(
      parsed,
      projectId,
      phaseId,
      latestSnapshot,
      priorPlan,
      meta,
      revalidateProject,
    );
    if (persistError) {
      return persistError;
    }
  } else {
    await persistAssistantTextReply(
      openAiOutcome.rawText,
      projectId,
      phaseId,
      built.profile,
      meta,
      revalidateProject,
    );
  }

  await recordUsage({
    userId,
    projectId,
    modelId: model,
    contextProfile: built.profile,
    promptTokens: openAiOutcome.promptTokens,
    completionTokens: openAiOutcome.completionTokens,
  });
}
