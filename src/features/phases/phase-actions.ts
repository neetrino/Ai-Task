'use server';

import { revalidatePath } from 'next/cache';
import { revalidateProjectData } from '@/shared/lib/project-cache-tags';
import { z } from 'zod';
import { prisma } from '@/shared/lib/prisma';
import { requireActiveUserId } from '@/shared/lib/session';

const labelSchema = z.string().min(1).max(200);

export type CreatePhaseState = { error: string } | { success: true; phaseId: string };

export async function createPhase(
  projectId: string,
  _prev: unknown,
  formData: FormData,
): Promise<CreatePhaseState> {
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
  const agg = await prisma.phase.aggregate({
    where: { projectId },
    _max: { lastUsedAt: true },
  });
  const maxT = Math.max(
    agg._max.lastUsedAt?.getTime() ?? 0,
    project.mainLastUsedAt.getTime(),
  );
  const lastUsedAt = new Date(maxT + 1);

  const phase = await prisma.phase.create({
    data: {
      projectId,
      label: parsed.data.trim(),
      sortOrder: count,
      lastUsedAt,
    },
  });
  revalidatePath(`/app/projects/${project.slug}`);
  revalidateProjectData(projectId);
  return { success: true, phaseId: phase.id };
}

/**
 * Marks a phase (or Main when `phaseId` is null) as recently used so the sidebar order updates.
 */
export async function touchPhaseActivity(projectId: string, phaseId: string | null): Promise<void> {
  const userId = await requireActiveUserId();
  const project = await prisma.project.findFirst({
    where: { id: projectId, ownerId: userId },
    select: { id: true, slug: true },
  });
  if (!project) {
    return;
  }
  const now = new Date();
  if (phaseId === null) {
    await prisma.project.update({
      where: { id: projectId },
      data: { mainLastUsedAt: now },
    });
  } else {
    await prisma.phase.updateMany({
      where: { id: phaseId, projectId },
      data: { lastUsedAt: now },
    });
  }
  revalidatePath(`/app/projects/${project.slug}`);
  revalidateProjectData(projectId);
}
