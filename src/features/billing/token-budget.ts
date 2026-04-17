/**
 * Per-user / per-project token accounting.
 *
 * - Lazy monthly reset: every read checks `tokensResetAt` and rolls forward
 *   when the period boundary has passed. No cron required.
 * - Soft warning at 80% of cap → router downgrades one tier (Étape 5 reads
 *   the `BudgetPressure` flag).
 * - Hard block at 100% of cap → preflight rejects with a structured error.
 * - Both user and project caps apply; the tighter one wins.
 */

import { Prisma } from '@prisma/client';
import { logger } from '@/shared/lib/logger';
import { prisma } from '@/shared/lib/prisma';
import type { BudgetPressure } from '@/features/ai-router/router';

/** 30-day rolling window expressed as ms (used for the lazy period reset). */
const PERIOD_MS = 30 * 24 * 60 * 60 * 1000;

/** Threshold at which the router starts to downgrade. */
export const SOFT_WARN_RATIO = 0.8;

export type BudgetSnapshot = {
  readonly userUsed: number;
  readonly userCap: number | null;
  readonly projectUsed: number;
  readonly projectCap: number | null;
  readonly pressure: BudgetPressure;
  /** True when *any* effective cap has been reached. */
  readonly blocked: boolean;
};

type ResettableRow = {
  tokensUsedMonth: number;
  tokensResetAt: Date;
};

/**
 * Returns the row's current usage, rolling the window forward when the
 * period has elapsed. Caller passes the just-loaded row so this stays pure
 * for the snapshot path; the actual write happens inside `recordUsage`.
 */
function effectiveUsage(row: ResettableRow, now: Date): number {
  const ageMs = now.getTime() - row.tokensResetAt.getTime();
  if (ageMs >= PERIOD_MS) return 0;
  return row.tokensUsedMonth;
}

function computePressure(used: number, cap: number | null): BudgetPressure {
  if (cap === null || cap <= 0) return 'none';
  if (used >= cap) return 'over-cap';
  if (used / cap >= SOFT_WARN_RATIO) return 'soft-warn';
  return 'none';
}

function maxPressure(a: BudgetPressure, b: BudgetPressure): BudgetPressure {
  if (a === 'over-cap' || b === 'over-cap') return 'over-cap';
  if (a === 'soft-warn' || b === 'soft-warn') return 'soft-warn';
  return 'none';
}

/**
 * Loads the user's and project's current usage and computes the combined
 * pressure signal the router consumes. Returns `blocked = true` when either
 * cap has been reached.
 */
export async function loadBudgetSnapshot(params: {
  userId: string;
  projectId: string;
}): Promise<BudgetSnapshot> {
  const now = new Date();
  const [user, project] = await Promise.all([
    prisma.user.findUnique({
      where: { id: params.userId },
      select: { tokensUsedMonth: true, tokensCapMonth: true, tokensResetAt: true },
    }),
    prisma.project.findUnique({
      where: { id: params.projectId },
      select: { tokensUsedMonth: true, tokensCapMonth: true, tokensResetAt: true },
    }),
  ]);

  const userUsed = user ? effectiveUsage(user, now) : 0;
  const userCap = user?.tokensCapMonth ?? null;
  const projectUsed = project ? effectiveUsage(project, now) : 0;
  const projectCap = project?.tokensCapMonth ?? null;

  const pressure = maxPressure(
    computePressure(userUsed, userCap),
    computePressure(projectUsed, projectCap),
  );

  return {
    userUsed,
    userCap,
    projectUsed,
    projectCap,
    pressure,
    blocked: pressure === 'over-cap',
  };
}

/**
 * Atomic increment with lazy period reset. If the row's window has rolled
 * over we reset the counter to `tokens` and bump `tokensResetAt`; otherwise
 * we add to the existing counter. Run inside the same transaction so user
 * and project counters cannot diverge on retries.
 */
async function bumpCounter(
  tx: Prisma.TransactionClient,
  table: 'user' | 'project',
  id: string,
  tokens: number,
  now: Date,
): Promise<void> {
  if (table === 'user') {
    const row = await tx.user.findUnique({
      where: { id },
      select: { tokensUsedMonth: true, tokensResetAt: true },
    });
    if (!row) return;
    const expired = now.getTime() - row.tokensResetAt.getTime() >= PERIOD_MS;
    await tx.user.update({
      where: { id },
      data: expired
        ? { tokensUsedMonth: tokens, tokensResetAt: now }
        : { tokensUsedMonth: { increment: tokens } },
    });
    return;
  }

  const row = await tx.project.findUnique({
    where: { id },
    select: { tokensUsedMonth: true, tokensResetAt: true },
  });
  if (!row) return;
  const expired = now.getTime() - row.tokensResetAt.getTime() >= PERIOD_MS;
  await tx.project.update({
    where: { id },
    data: expired
      ? { tokensUsedMonth: tokens, tokensResetAt: now }
      : { tokensUsedMonth: { increment: tokens } },
  });
}

export type RecordUsageInput = {
  userId: string;
  projectId: string;
  modelId: string;
  contextProfile: 'lite' | 'doc' | 'plan';
  promptTokens: number;
  completionTokens: number;
};

/**
 * Append a `TokenUsageEvent` and bump the denormalised counters. Errors are
 * logged but not rethrown — billing must never break a successful chat
 * response.
 */
export async function recordUsage(input: RecordUsageInput): Promise<void> {
  const totalTokens = input.promptTokens + input.completionTokens;
  if (totalTokens <= 0) return;

  const now = new Date();
  try {
    await prisma.$transaction(async (tx) => {
      await tx.tokenUsageEvent.create({
        data: {
          userId: input.userId,
          projectId: input.projectId,
          modelId: input.modelId,
          contextProfile: input.contextProfile,
          promptTokens: input.promptTokens,
          completionTokens: input.completionTokens,
        },
      });
      await bumpCounter(tx, 'user', input.userId, totalTokens, now);
      await bumpCounter(tx, 'project', input.projectId, totalTokens, now);
    });
  } catch (err) {
    logger.error(
      { err, userId: input.userId, projectId: input.projectId },
      'recordUsage failed (chat reply already saved)',
    );
  }
}
