'use server';

import { revalidatePath } from 'next/cache';
import { revalidateProjectData } from '@/shared/lib/project-cache-tags';
import { planSchema, type PlanPayload } from '@/shared/domain/plan';
import { prisma } from '@/shared/lib/prisma';
import { requireActiveUserId } from '@/shared/lib/session';
import { logger } from '@/shared/lib/logger';

export async function setPlanTaskSyncSelected(
  projectId: string,
  phaseId: string | null,
  epicIndex: number,
  taskIndex: number,
  syncSelected: boolean,
): Promise<{ ok: true } | { error: string }> {
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

  const latest = await prisma.planSnapshot.findFirst({
    where: { projectId, phaseId },
    orderBy: { updatedAt: 'desc' },
  });
  if (!latest) {
    return { error: 'No plan snapshot' };
  }

  let plan: PlanPayload;
  try {
    plan = planSchema.parse(latest.payload);
  } catch (e) {
    logger.warn({ err: e, projectId }, 'setPlanTaskSyncSelected: invalid snapshot');
    return { error: 'Stored plan is invalid' };
  }

  const epic = plan.epics[epicIndex];
  if (!epic || !epic.tasks[taskIndex]) {
    return { error: 'Task not found' };
  }

  const epics = plan.epics.map((e, ei) => {
    if (ei !== epicIndex) return e;
    const tasks = e.tasks.map((t, ti) =>
      ti === taskIndex ? { ...t, syncSelected } : t,
    );
    return { ...e, tasks };
  });

  const next = planSchema.parse({ ...plan, epics });

  await prisma.planSnapshot.update({
    where: { id: latest.id },
    data: { payload: next as object },
  });

  revalidatePath(`/app/projects/${project.slug}`);
  revalidatePath('/app/account');
  revalidateProjectData(projectId);
  return { ok: true };
}
