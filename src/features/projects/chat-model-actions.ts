'use server';

import { revalidatePath } from 'next/cache';
import { revalidateProjectData } from '@/shared/lib/project-cache-tags';
import { logger } from '@/shared/lib/logger';
import { isKnownModelId, isModelPreset, type ModelPreset } from '@/shared/lib/ai-models';
import { isAllowedChatModelId } from '@/shared/lib/openai-model';
import { prisma } from '@/shared/lib/prisma';
import { requireActiveUserId } from '@/shared/lib/session';

/**
 * @deprecated kept for the legacy ChatModelForm. New code goes through
 * `updateProjectModelPreset`.
 */
export async function updateProjectChatModel(projectId: string, formData: FormData): Promise<void> {
  const userId = await requireActiveUserId();
  const project = await prisma.project.findFirst({
    where: { id: projectId, ownerId: userId },
  });
  if (!project) {
    logger.warn({ projectId }, 'updateProjectChatModel: project not found');
    return;
  }

  const raw = formData.get('openaiChatModel');
  if (typeof raw !== 'string') {
    return;
  }
  const trimmed = raw.trim();
  if (!isAllowedChatModelId(trimmed)) {
    logger.warn({ projectId, trimmed }, 'updateProjectChatModel: model not in allowlist');
    return;
  }
  await prisma.project.update({
    where: { id: projectId },
    data: { openaiChatModel: trimmed },
  });
  revalidatePath(`/app/projects/${project.slug}`);
  revalidatePath('/app/account');
  revalidateProjectData(projectId);
}

/**
 * Saves the project's model preset (and optional pinned model id when the
 * preset is `PINNED`). Used by the new preset-based ChatModelForm.
 */
export async function updateProjectModelPreset(
  projectId: string,
  formData: FormData,
): Promise<void> {
  const userId = await requireActiveUserId();
  const project = await prisma.project.findFirst({
    where: { id: projectId, ownerId: userId },
  });
  if (!project) {
    logger.warn({ projectId }, 'updateProjectModelPreset: project not found');
    return;
  }

  const rawPreset = formData.get('preset');
  if (typeof rawPreset !== 'string' || !isModelPreset(rawPreset)) {
    logger.warn({ projectId, rawPreset }, 'updateProjectModelPreset: invalid preset');
    return;
  }
  const preset: ModelPreset = rawPreset;

  let pinnedModelId: string | null = null;
  if (preset === 'PINNED') {
    const rawPin = formData.get('pinnedModelId');
    if (typeof rawPin !== 'string' || !isKnownModelId(rawPin.trim())) {
      logger.warn({ projectId, rawPin }, 'updateProjectModelPreset: invalid pinned model');
      return;
    }
    pinnedModelId = rawPin.trim();
  }

  await prisma.project.update({
    where: { id: projectId },
    data: { modelPreset: preset, pinnedModelId },
  });
  revalidatePath(`/app/projects/${project.slug}`);
  revalidatePath('/app/account');
  revalidateProjectData(projectId);
}
