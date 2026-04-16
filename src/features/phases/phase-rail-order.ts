import type { Phase } from '@prisma/client';

export type PhaseRailEntry = { kind: 'main' } | { kind: 'phase'; phase: Phase };

/**
 * Main and phases in one list, most recently used first (by `mainLastUsedAt` / `phase.lastUsedAt`).
 */
export function buildPhaseRailOrder(mainLastUsedAt: Date, phases: Phase[]): PhaseRailEntry[] {
  const scored: Array<{ entry: PhaseRailEntry; t: number }> = [
    { entry: { kind: 'main' }, t: mainLastUsedAt.getTime() },
    ...phases.map((p) => ({
      entry: { kind: 'phase', phase: p } as const,
      t: p.lastUsedAt.getTime(),
    })),
  ];
  scored.sort((a, b) => b.t - a.t);
  return scored.map((s) => s.entry);
}
