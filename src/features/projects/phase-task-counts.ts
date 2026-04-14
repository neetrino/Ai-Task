import type { Phase } from '@prisma/client';
import { prisma } from '@/shared/lib/prisma';
import { DEFAULT_PLAN, parsePlanFromJson, type PlanPayload } from '@/shared/domain/plan';
import { countPlanTasks } from '@/features/projects/plan-tasks-iterate';

export type PhaseTaskCounts = {
  main: number;
  byPhaseId: Record<string, number>;
};

function safePlan(payload: unknown | null | undefined): PlanPayload {
  if (payload == null) return DEFAULT_PLAN;
  try {
    return parsePlanFromJson(payload);
  } catch {
    return DEFAULT_PLAN;
  }
}

/**
 * Latest snapshot per phase (and main) for task count badges in the phase rail.
 */
export async function getPhaseTaskCounts(
  projectId: string,
  phases: Pick<Phase, 'id'>[],
): Promise<PhaseTaskCounts> {
  const snapshots = await prisma.planSnapshot.findMany({
    where: { projectId },
    orderBy: { updatedAt: 'desc' },
  });

  const mainSnap = snapshots.find((s) => s.phaseId === null);
  const firstByPhase = new Map<string, (typeof snapshots)[0]>();
  for (const s of snapshots) {
    if (s.phaseId === null) continue;
    if (!firstByPhase.has(s.phaseId)) {
      firstByPhase.set(s.phaseId, s);
    }
  }

  const main = countPlanTasks(safePlan(mainSnap?.payload));
  const byPhaseId: Record<string, number> = {};
  for (const p of phases) {
    const snap = firstByPhase.get(p.id);
    byPhaseId[p.id] = countPlanTasks(safePlan(snap?.payload));
  }

  return { main, byPhaseId };
}
