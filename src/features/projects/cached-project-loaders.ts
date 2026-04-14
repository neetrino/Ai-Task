import { unstable_cache } from 'next/cache';
import type { Phase } from '@prisma/client';
import { getPhaseTaskCounts } from '@/features/projects/phase-task-counts';
import { prisma } from '@/shared/lib/prisma';
import { projectDataTag } from '@/shared/lib/project-cache-tags';

const MESSAGE_PAGE_SIZE = 100;

export async function getCachedPlanSnapshot(projectId: string, phaseId: string | null) {
  const run = unstable_cache(
    async () =>
      prisma.planSnapshot.findFirst({
        where: { projectId, phaseId },
        orderBy: { updatedAt: 'desc' },
      }),
    ['plan-snapshot', projectId, phaseId ?? 'main'],
    { tags: [projectDataTag(projectId)] },
  );
  return run();
}

export async function getCachedPhaseMessages(projectId: string, phaseId: string | null) {
  const run = unstable_cache(
    async () =>
      prisma.message.findMany({
        where: { projectId, phaseId },
        orderBy: { createdAt: 'asc' },
        take: MESSAGE_PAGE_SIZE,
      }),
    ['phase-messages', projectId, phaseId ?? 'main', String(MESSAGE_PAGE_SIZE)],
    { tags: [projectDataTag(projectId)] },
  );
  return run();
}

export async function getCachedPhaseTaskCounts(projectId: string, phases: Pick<Phase, 'id'>[]) {
  const phaseKey = [...phases.map((p) => p.id)].sort().join(',');
  const run = unstable_cache(
    async () => getPhaseTaskCounts(projectId, phases),
    ['phase-task-counts', projectId, phaseKey],
    { tags: [projectDataTag(projectId)] },
  );
  return run();
}
