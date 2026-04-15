'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { isBitrixProjectConnectionComplete } from '@/features/bitrix-sync/bitrix-project-connection-status';
import {
  BitrixProjectSettingsDialog,
  type BitrixSettingsProject,
} from '@/features/projects/BitrixProjectSettingsDialog';
import { WORKSPACE_FIELD_CLASS } from '@/shared/ui/workspace-ui';

const CONNECTION_BTN_BASE =
  'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition focus:outline-none focus:ring-2 focus:ring-violet-500/35';

/** Needs Bitrix project / owner / assignee ids */
const CONNECTION_BTN_INCOMPLETE_CLASS = `${CONNECTION_BTN_BASE} border border-amber-500/55 bg-amber-950/35 text-amber-100 hover:border-amber-400/70 hover:bg-amber-950/55`;

/** All project-scoped Bitrix fields set */
const CONNECTION_BTN_COMPLETE_CLASS = `${CONNECTION_BTN_BASE} border border-emerald-600/40 bg-slate-800 text-emerald-200/95 hover:border-emerald-500/55 hover:bg-slate-700/80`;

const PROJECT_SELECT_CLASS = `${WORKSPACE_FIELD_CLASS} min-w-0 flex-1 py-2 text-lg font-semibold leading-snug tracking-tight text-neutral-100`;

type ProjectOption = { slug: string; name: string };

export function ProjectWorkspaceRailHeader({
  projects,
  activeSlug,
  project,
  activePhaseId,
}: {
  projects: ProjectOption[];
  activeSlug: string;
  project: BitrixSettingsProject;
  activePhaseId: string | null;
}) {
  const router = useRouter();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const connected = isBitrixProjectConnectionComplete(project);

  function onProjectChange(slug: string) {
    if (slug === activeSlug) return;
    router.push(`/app/projects/${slug}`);
  }

  return (
    <>
      <div className="flex min-w-0 items-center gap-2">
        <button
          aria-label="Bitrix connection settings"
          className={connected ? CONNECTION_BTN_COMPLETE_CLASS : CONNECTION_BTN_INCOMPLETE_CLASS}
          onClick={() => setSettingsOpen(true)}
          title={connected ? 'Bitrix: connected' : 'Bitrix: configure connection'}
          type="button"
        >
          {connected ? (
            <svg aria-hidden className="h-4 w-4" fill="none" viewBox="0 0 24 24">
              <path
                className="stroke-current"
                d="M5 13l4 4L19 7"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.25}
              />
            </svg>
          ) : (
            <svg aria-hidden className="h-4 w-4" fill="none" viewBox="0 0 24 24">
              <path
                className="stroke-current"
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.75}
              />
            </svg>
          )}
        </button>
        <label className="min-w-0 flex-1">
          <span className="sr-only">Switch project</span>
          <select
            className={PROJECT_SELECT_CLASS}
            onChange={(e) => onProjectChange(e.target.value)}
            value={activeSlug}
          >
            {projects.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <BitrixProjectSettingsDialog
        activePhaseId={activePhaseId}
        onClose={() => setSettingsOpen(false)}
        open={settingsOpen}
        project={project}
      />
    </>
  );
}
