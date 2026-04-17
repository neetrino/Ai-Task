'use client';

import { useState } from 'react';
import { isBitrixProjectConnectionComplete } from '@/features/bitrix-sync/bitrix-project-connection-status';
import {
  BitrixProjectSettingsDialog,
  type BitrixSettingsProject,
} from '@/features/projects/BitrixProjectSettingsDialog';
import { ProjectSettingsDialog } from '@/features/projects/ProjectSettingsDialog';
import {
  DECOMPOSITION_LEVEL_DESCRIPTIONS,
  type PlanPayload,
} from '@/shared/domain/plan-defaults';
import { WORKSPACE_BODY_CLASS } from '@/shared/ui/workspace-ui';
import { WorkspaceModal } from '@/shared/ui/WorkspaceModal';

const SOFT_ACTION_GRID_CLASS = 'grid w-full grid-cols-2 gap-1.5';

const SOFT_ACTION_BTN_CLASS =
  'group relative flex min-h-8 w-full items-center justify-center gap-1.5 rounded-lg border border-white/[0.06] bg-neutral-900/50 px-2 py-1.5 text-xs font-medium text-neutral-400 transition-colors hover:border-white/12 hover:bg-neutral-800/60 hover:text-neutral-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/30';

const BITRIX_DOT_CONNECTED = 'bg-emerald-400/90';
const BITRIX_DOT_INCOMPLETE = 'bg-amber-400/90';

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden className={className} fill="none" viewBox="0 0 24 24">
      <path
        className="stroke-current"
        d="M12 16v-4m0-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
      />
    </svg>
  );
}

function RulesIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden className={className} fill="none" viewBox="0 0 24 24">
      <path
        className="stroke-current"
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
      />
    </svg>
  );
}

function ProgressIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden className={className} fill="none" viewBox="0 0 24 24">
      <path
        className="stroke-current"
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
      />
    </svg>
  );
}

function LinkIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden className={className} fill="none" viewBox="0 0 24 24">
      <path
        className="stroke-current"
        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
      />
    </svg>
  );
}

function MemoryIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden className={className} fill="none" viewBox="0 0 24 24">
      <path
        className="stroke-current"
        d="M9 3a3 3 0 00-3 3v.5A3.5 3.5 0 003 10v4a3.5 3.5 0 003 3.464V18a3 3 0 003 3h6a3 3 0 003-3v-.536A3.5 3.5 0 0021 14v-4a3.5 3.5 0 00-3-3.5V6a3 3 0 00-3-3H9zm0 4h6m-6 4h6m-6 4h4"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
      />
    </svg>
  );
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden className={className} fill="none" viewBox="0 0 24 24">
      <path
        className="stroke-current"
        d="M10.325 4.317a1.724 1.724 0 013.35 0c.181.79.86 1.396 1.689 1.5.83.105 1.617-.412 1.802-1.196M19.4 7.5c.79.18 1.396.86 1.5 1.69.105.83-.412 1.616-1.196 1.802m-1.196 4.012c.79.18 1.396.86 1.5 1.69.105.83-.412 1.616-1.196 1.802M16.5 19.4c-.18.79-.86 1.396-1.69 1.5-.83.105-1.616-.412-1.802-1.196M9.012 19.704c-.18.79-.86 1.396-1.69 1.5-.83.105-1.616-.412-1.802-1.196M4.6 16.5c-.79-.18-1.396-.86-1.5-1.69-.105-.83.412-1.616 1.196-1.802m1.196-4.012c-.79-.18-1.396-.86-1.5-1.69-.105-.83.412-1.616 1.196-1.802M7.5 4.6c.18-.79.86-1.396 1.69-1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
      />
      <circle className="stroke-current" cx={12} cy={12} r={3} strokeWidth={1.5} />
    </svg>
  );
}

function AboutProjectBody({ plan, projectName }: { plan: PlanPayload; projectName: string }) {
  const showPlanTitle = Boolean(plan.project_title) && plan.project_title !== projectName;

  return (
    <div className={`space-y-4 ${WORKSPACE_BODY_CLASS}`}>
      <div>
        <p className="text-xs font-medium text-neutral-500">Name</p>
        <p className="mt-1 text-sm text-neutral-200">{projectName}</p>
      </div>
      {showPlanTitle ? (
        <div>
          <p className="text-xs font-medium text-neutral-500">Plan title</p>
          <p className="mt-1 text-sm text-neutral-200">{plan.project_title}</p>
        </div>
      ) : null}
      <div>
        <p className="text-xs font-medium text-neutral-500">Epic mode</p>
        <p className="mt-1 text-sm capitalize text-neutral-200">
          {plan.epic_mode.replace(/_/g, ' ')}
        </p>
      </div>
      {plan.decomposition_level ? (
        <div>
          <p className="text-xs font-medium text-neutral-500">Decomposition</p>
          <p className="mt-1 text-sm text-neutral-200">
            {plan.decomposition_level} — {DECOMPOSITION_LEVEL_DESCRIPTIONS[plan.decomposition_level]}
          </p>
          {plan.decomposition_estimate_note ? (
            <p className="mt-2 text-sm text-neutral-300">{plan.decomposition_estimate_note}</p>
          ) : null}
        </div>
      ) : null}
      <div>
        <p className="text-xs font-medium text-neutral-500">Epics</p>
        <ul className="mt-2 space-y-3">
          {plan.epics.map((epic, index) => (
            <li
              className="rounded-lg border border-white/[0.06] bg-neutral-900/40 px-3 py-2"
              key={`${epic.name}-${index}`}
            >
              <p className="text-sm font-medium text-neutral-200">{epic.name}</p>
              {epic.description ? (
                <p className="mt-1 text-sm leading-relaxed text-neutral-400">{epic.description}</p>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/**
 * Compact rail actions: project summary, placeholders, Bitrix settings, project settings.
 */
export function ProjectRailQuickActions({
  projectName,
  projectSlug,
  plan,
  bitrixProject,
  activePhaseId,
}: {
  projectName: string;
  projectSlug: string;
  plan: PlanPayload;
  bitrixProject: BitrixSettingsProject;
  activePhaseId: string | null;
}) {
  const [aboutOpen, setAboutOpen] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [progressOpen, setProgressOpen] = useState(false);
  const [bitrixOpen, setBitrixOpen] = useState(false);
  const [memoryOpen, setMemoryOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const bitrixOk = isBitrixProjectConnectionComplete(bitrixProject);

  return (
    <>
      <div className={SOFT_ACTION_GRID_CLASS}>
        <button
          className={SOFT_ACTION_BTN_CLASS}
          onClick={() => setAboutOpen(true)}
          type="button"
        >
          <InfoIcon className="h-3.5 w-3.5 shrink-0 text-neutral-500 group-hover:text-neutral-300" />
          About
        </button>
        <button
          className={SOFT_ACTION_BTN_CLASS}
          onClick={() => setRulesOpen(true)}
          type="button"
        >
          <RulesIcon className="h-3.5 w-3.5 shrink-0 text-neutral-500 group-hover:text-neutral-300" />
          Rules
        </button>
        <button
          className={SOFT_ACTION_BTN_CLASS}
          onClick={() => setProgressOpen(true)}
          type="button"
        >
          <ProgressIcon className="h-3.5 w-3.5 shrink-0 text-neutral-500 group-hover:text-neutral-300" />
          Progress
        </button>
        <button
          aria-label="Bitrix connection settings"
          className={SOFT_ACTION_BTN_CLASS}
          onClick={() => setBitrixOpen(true)}
          title={bitrixOk ? 'Bitrix: connected' : 'Bitrix: configure connection'}
          type="button"
        >
          <LinkIcon className="h-3.5 w-3.5 shrink-0 text-neutral-500 group-hover:text-neutral-300" />
          Link
          <span
            aria-hidden
            className={`pointer-events-none absolute bottom-1 right-1.5 h-1.5 w-1.5 rounded-full ${
              bitrixOk ? BITRIX_DOT_CONNECTED : BITRIX_DOT_INCOMPLETE
            }`}
          />
        </button>
        <button
          className={SOFT_ACTION_BTN_CLASS}
          onClick={() => setMemoryOpen(true)}
          type="button"
        >
          <MemoryIcon className="h-3.5 w-3.5 shrink-0 text-neutral-500 group-hover:text-neutral-300" />
          Memory
        </button>
        <button
          aria-label="Project settings"
          className={SOFT_ACTION_BTN_CLASS}
          onClick={() => setSettingsOpen(true)}
          type="button"
        >
          <SettingsIcon className="h-3.5 w-3.5 shrink-0 text-neutral-500 group-hover:text-neutral-300" />
          Settings
        </button>
      </div>

      <WorkspaceModal onClose={() => setAboutOpen(false)} open={aboutOpen} title="About">
        <AboutProjectBody plan={plan} projectName={projectName} />
      </WorkspaceModal>

      <WorkspaceModal onClose={() => setRulesOpen(false)} open={rulesOpen} title="Rules">
        <p className={`${WORKSPACE_BODY_CLASS} text-sm leading-relaxed`}>Coming soon.</p>
      </WorkspaceModal>

      <WorkspaceModal onClose={() => setProgressOpen(false)} open={progressOpen} title="Progress">
        <p className={`${WORKSPACE_BODY_CLASS} text-sm leading-relaxed`}>Coming soon.</p>
      </WorkspaceModal>

      <WorkspaceModal onClose={() => setMemoryOpen(false)} open={memoryOpen} title="Memory">
        <p className={`${WORKSPACE_BODY_CLASS} text-sm leading-relaxed`}>Coming soon.</p>
      </WorkspaceModal>

      <BitrixProjectSettingsDialog
        activePhaseId={activePhaseId}
        onClose={() => setBitrixOpen(false)}
        open={bitrixOpen}
        project={bitrixProject}
      />

      <ProjectSettingsDialog
        onClose={() => setSettingsOpen(false)}
        open={settingsOpen}
        projectSlug={projectSlug}
      />
    </>
  );
}
