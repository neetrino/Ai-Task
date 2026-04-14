'use server';

import { revalidatePath } from 'next/cache';
import { revalidateProjectData } from '@/shared/lib/project-cache-tags';
import { parsePlanFromJson } from '@/shared/domain/plan';
import { prisma } from '@/shared/lib/prisma';
import { requireActiveUserId } from '@/shared/lib/session';

export async function savePlanSnapshot(
  projectId: string,
  phaseId: string | null,
  rawPlanJson: string,
): Promise<{ error?: string } | void> {
  const userId = await requireActiveUserId();
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

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawPlanJson) as unknown;
  } catch {
    return { error: 'Invalid JSON' };
  }

  let plan;
  try {
    plan = parsePlanFromJson(parsed);
  } catch {
    return { error: 'Plan does not match the required schema' };
  }

  const latest = await prisma.planSnapshot.findFirst({
    where: { projectId, phaseId },
    orderBy: { updatedAt: 'desc' },
  });

  await prisma.planSnapshot.create({
    data: {
      projectId,
      phaseId,
      payload: plan as object,
      version: (latest?.version ?? 0) + 1,
    },
  });

  revalidatePath(`/app/projects/${project.slug}`);
  revalidatePath('/app/account');
  revalidateProjectData(projectId);
}
