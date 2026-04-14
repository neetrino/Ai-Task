import Link from 'next/link';
import type { Phase } from '@prisma/client';
import {
  WORKSPACE_BODY_CLASS,
  WORKSPACE_PHASE_ACTIVE_CLASS,
  WORKSPACE_PHASE_IDLE_CLASS,
} from '@/shared/ui/workspace-ui';

export function PhasePills({
  projectSlug,
  phases,
  activePhaseId,
}: {
  projectSlug: string;
  phases: Phase[];
  activePhaseId: string | null;
}) {
  return (
    <div>
      <p className={`mb-2 text-xs font-medium uppercase tracking-wide text-slate-500`}>Phase</p>
      <div className="flex flex-wrap gap-1.5">
        <Link
          className={
            activePhaseId === null ? WORKSPACE_PHASE_ACTIVE_CLASS : WORKSPACE_PHASE_IDLE_CLASS
          }
          href={`/app/projects/${projectSlug}`}
        >
          Main
        </Link>
        {phases.map((p) => (
          <Link
            className={
              activePhaseId === p.id ? WORKSPACE_PHASE_ACTIVE_CLASS : WORKSPACE_PHASE_IDLE_CLASS
            }
            href={`/app/projects/${projectSlug}?phase=${p.id}`}
            key={p.id}
          >
            {p.label}
          </Link>
        ))}
      </div>
      <p className={`mt-2 ${WORKSPACE_BODY_CLASS} text-xs`}>Chat and plan are scoped to this phase.</p>
    </div>
  );
}
