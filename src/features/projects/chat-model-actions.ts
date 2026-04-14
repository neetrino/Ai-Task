'use server';

import { revalidatePath } from 'next/cache';
import { logger } from '@/shared/lib/logger';
import { prisma } from '@/shared/lib/prisma';
import { requireSessionUserId } from '@/shared/lib/session';

const MODEL_ID_PATTERN = /^[a-zA-Z0-9._-]+$/;

export async function updateProjectChatModel(projectId: string, formData: FormData): Promise<void> {
  const userId = await requireSessionUserId();
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
  if (trimmed === '') {
    await prisma.project.update({
      where: { id: projectId },
      data: { openaiChatModel: null },
    });
    revalidatePath(`/app/projects/${project.slug}`);
    return;
  }
  if (trimmed.length > 64 || !MODEL_ID_PATTERN.test(trimmed)) {
    logger.warn({ projectId, len: trimmed.length }, 'updateProjectChatModel: invalid model id');
    return;
  }
  await prisma.project.update({
    where: { id: projectId },
    data: { openaiChatModel: trimmed },
  });
  revalidatePath(`/app/projects/${project.slug}`);
}
