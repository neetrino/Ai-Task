'use server';

import { revalidatePath } from 'next/cache';
import { resolveBitrixContext } from '@/server/bitrix/env';
import { parsePlan } from '@/server/bitrix/parse-plan';
import { runSyncPlan } from '@/server/bitrix/sync';
import { prisma } from '@/shared/lib/prisma';
import { enforceRateLimit } from '@/shared/lib/rate-limit';
import { requireActiveUserId } from '@/shared/lib/session';
import { logger } from '@/shared/lib/logger';

export async function syncProjectToBitrix(
  projectId: string,
  phaseId: string | null,
  dryRun: boolean,
): Promise<{ ok: true; message: string } | { error: string }> {
  const userId = await requireActiveUserId();
  await enforceRateLimit(`sync:${userId}`);

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

  const webhook = process.env.Webhook_URL?.trim();
  if (!webhook) {
    return { error: 'Webhook_URL is not configured on the server' };
  }

  if (!project.bitrixProjectId || !project.taskOwnerId || !project.taskAssigneeId) {
    return { error: 'Fill Bitrix project id, task owner, and assignee in project settings' };
  }

  if (!dryRun && project.bitrixSyncCompleted) {
    return {
      error:
        'This project was already synced to Bitrix. Uncheck «Sync already completed» above the sync buttons, then try again.',
    };
  }

  const snapshot = await prisma.planSnapshot.findFirst({
    where: { projectId, phaseId },
    orderBy: { updatedAt: 'desc' },
  });
  if (!snapshot) {
    return { error: 'No plan to sync. Chat with AI or save a plan first.' };
  }

  let plan;
  try {
    plan = parsePlan(snapshot.payload);
  } catch (e) {
    logger.error({ err: e }, 'snapshot payload parse failed');
    return { error: 'Stored plan is invalid. Re-save the plan.' };
  }

  try {
    const env = resolveBitrixContext({
      webhook,
      projectBitrixId: project.bitrixProjectId,
      taskOwnerId: project.taskOwnerId,
      taskAssigneeId: project.taskAssigneeId,
    });
    await runSyncPlan(plan, env, dryRun);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Sync failed';
    logger.error({ err: e, projectId }, 'Bitrix sync failed');
    return { error: msg };
  }

  if (!dryRun) {
    await prisma.project.update({
      where: { id: projectId },
      data: { bitrixSyncCompleted: true },
    });
  }

  revalidatePath(`/app/projects/${project.slug}`);
  return {
    ok: true,
    message: dryRun ? 'Dry run completed (no tasks created).' : 'Sync completed.',
  };
}
