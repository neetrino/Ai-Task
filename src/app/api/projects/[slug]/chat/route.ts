import { NextRequest } from 'next/server';
import { z } from 'zod';
import { ATTACHMENT_MAX_PER_MESSAGE } from '@/features/attachments/attachment-rules';
import {
  detectContextProfile,
  stripPlanCommand,
} from '@/features/ai-router/context-profile';
import {
  classifyMessageWithLlm,
  shouldUseLlmClassifier,
} from '@/features/ai-router/llm-classifier';
import { pickModelAndProfile } from '@/features/ai-router/router';
import { loadBudgetSnapshot } from '@/features/billing/token-budget';
import { runProjectChatTurn } from '@/features/chat/project-chat-turn';
import { logger } from '@/shared/lib/logger';
import { prisma } from '@/shared/lib/prisma';
import { requireActiveUserForApi } from '@/shared/lib/session';

const CHAT_MESSAGE_MAX_LEN = 100_000;

const chatPostBodySchema = z.object({
  message: z.string().max(CHAT_MESSAGE_MAX_LEN),
  phaseId: z.union([z.string().min(1), z.null()]).optional(),
  attachmentIds: z.array(z.string().min(1)).max(ATTACHMENT_MAX_PER_MESSAGE).optional(),
  /** UI button "Plan" (and `/plan` command) sets this to force planning. */
  explicitPlanIntent: z.boolean().optional(),
  /** Per-turn override of the project's default model preset. */
  oneOffPreset: z.enum(['AUTO', 'ECONOMY', 'BALANCED', 'QUALITY', 'PINNED']).optional(),
  /** Pinned model id when `oneOffPreset === 'PINNED'`. */
  oneOffPinnedModelId: z.string().min(1).optional(),
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
    select: {
      id: true,
      slug: true,
      openaiChatModel: true,
      modelPreset: true,
      pinnedModelId: true,
    },
  });
  if (!project) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  const phaseId = parsed.data.phaseId ?? null;

  const attachmentCount = parsed.data.attachmentIds?.length ?? 0;
  let profileDecision = detectContextProfile({
    message: composed,
    attachmentCount,
    explicitPlanIntent: parsed.data.explicitPlanIntent ?? false,
  });
  // Strip routing tokens (e.g. "/plan") so the LLM never sees them.
  const cleanedMessage = stripPlanCommand(composed);

  // For ambiguous messages where the deterministic detector defaulted to
  // `lite`, ask the cheap classifier whether this is actually a planning
  // request. Bounded by an 800ms timeout — failures are silently ignored.
  if (
    shouldUseLlmClassifier({
      deterministicProfile: profileDecision.profile,
      message: cleanedMessage,
      attachmentCount,
    })
  ) {
    const classified = await classifyMessageWithLlm({
      message: cleanedMessage,
      attachmentCount,
    });
    if (classified && classified.profile !== 'lite' && classified.confidence >= 0.6) {
      profileDecision = {
        profile: classified.profile,
        reason: classified.profile === 'plan' ? 'plan-keyword' : 'has-attachments',
      };
    }
  }

  const budget = await loadBudgetSnapshot({ userId, projectId: project.id });
  const effectivePreset = parsed.data.oneOffPreset ?? project.modelPreset;
  const effectivePinnedModelId =
    parsed.data.oneOffPreset === 'PINNED'
      ? (parsed.data.oneOffPinnedModelId ?? project.pinnedModelId)
      : parsed.data.oneOffPreset
        ? null
        : project.pinnedModelId;
  const routerDecision = pickModelAndProfile({
    preset: effectivePreset,
    pinnedModelId: effectivePinnedModelId,
    profileDecision,
    messageLength: cleanedMessage.length,
    attachmentCount,
    budgetPressure: budget.pressure,
  });
  logger.info(
    {
      projectId: project.id,
      profile: routerDecision.profile,
      profileReason: profileDecision.reason,
      modelId: routerDecision.model.id,
      modelTier: routerDecision.model.tier,
      routerReason: routerDecision.reason,
    },
    'Router decision',
  );

  const result = await runProjectChatTurn({
    userId,
    projectId: project.id,
    phaseId,
    message: cleanedMessage,
    signal: req.signal,
    project,
    attachmentIds: parsed.data.attachmentIds,
    contextProfile: routerDecision.profile,
    modelOverride: { modelId: routerDecision.model.id },
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
