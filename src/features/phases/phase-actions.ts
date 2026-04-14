'use server';

import { revalidatePath } from 'next/cache';
import { revalidateProjectData } from '@/shared/lib/project-cache-tags';
import { z } from 'zod';
import { prisma } from '@/shared/lib/prisma';
import { requireActiveUserId } from '@/shared/lib/session';

const labelSchema = z.string().min(1).max(200);

export async function createPhase(
  projectId: string,
  _prev: unknown,
  formData: FormData,
): Promise<{ error: string } | { success: true }> {
  const userId = await requireActiveUserId();
  const project = await prisma.project.findFirst({
    where: { id: projectId, ownerId: userId },
  });
  if (!project) {
    return { error: 'Project not found' };
  }
  const parsed = labelSchema.safeParse(formData.get('label'));
  if (!parsed.success) {
    return { error: 'Label is required' };
  }
  const count = await prisma.phase.count({ where: { projectId } });
  await prisma.phase.create({
    data: {
      projectId,
      label: parsed.data.trim(),
      sortOrder: count,
    },
  });
  revalidatePath(`/app/projects/${project.slug}`);
  revalidateProjectData(projectId);
  return { success: true };
}
