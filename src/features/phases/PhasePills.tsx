'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { Phase } from '@prisma/client';
import { PhaseCreateForm } from '@/features/phases/PhaseCreateForm';
import { WORKSPACE_PHASE_ACTIVE_CLASS, WORKSPACE_PHASE_IDLE_CLASS } from '@/shared/ui/workspace-ui';

export function PhasePills({
  projectId,
  projectSlug,
  phases,
  activePhaseId,
}: {
  projectId: string;
  projectSlug: string;
  phases: Phase[];
  activePhaseId: string | null;
}) {
  const [addOpen, setAddOpen] = useState(false);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-medium uppercase tracking-wide text-slate-500">Phase</span>
        <div className="flex flex-wrap items-center gap-1.5">
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
        <button
          aria-expanded={addOpen}
          aria-label={addOpen ? 'Close add phase' : 'Add phase'}
          className={`flex h-7 min-w-[1.75rem] items-center justify-center px-1.5 text-sm font-semibold leading-none ${WORKSPACE_PHASE_IDLE_CLASS}`}
          onClick={() => setAddOpen((v) => !v)}
          type="button"
        >
          +
        </button>
        </div>
      </div>
      {addOpen ? (
        <div className="mt-2 rounded-lg border border-white/10 bg-slate-950/50 p-2">
          <PhaseCreateForm
            onSuccess={() => setAddOpen(false)}
            projectId={projectId}
            variant="inline"
          />
        </div>
      ) : null}
    </div>
  );
}
