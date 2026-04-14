'use client';

import { useState } from 'react';
import { SyncToolbar } from '@/features/bitrix-sync/SyncToolbar';
import { BitrixSettingsForm } from '@/features/projects/BitrixSettingsForm';
import { WorkspaceModal } from '@/shared/ui/WorkspaceModal';
import { WORKSPACE_BODY_CLASS, WORKSPACE_GHOST_BTN_CLASS } from '@/shared/ui/workspace-ui';

/** Compact actions in the project header toolbar */
const TOOLBAR_TRIGGER_BTN_CLASS =
  'shrink-0 rounded-lg border border-white/12 bg-white/[0.05] px-2.5 py-1.5 text-center text-xs font-medium text-slate-200 transition hover:border-violet-400/35 hover:bg-white/[0.08] hover:text-white';

const PANEL_TRIGGER_BTN_CLASS =
  'w-full rounded-lg border border-white/15 bg-white/[0.06] px-3 py-2.5 text-center text-xs font-medium text-slate-100 transition hover:border-violet-400/40 hover:bg-white/[0.09] hover:text-white';

type ProjectForSettings = {
  id: string;
  openaiChatModel: string | null;
  bitrixProjectId: string | null;
  taskOwnerId: string | null;
  taskAssigneeId: string | null;
  bitrixSyncCompleted: boolean;
};

export function ProjectBitrixSetupPanel({
  project,
  exportMd,
  exportYaml,
  activePhaseId,
  layout = 'toolbar',
}: {
  project: ProjectForSettings;
  exportMd: string;
  exportYaml: string;
  activePhaseId: string | null;
  layout?: 'toolbar' | 'panel';
}) {
  const [open, setOpen] = useState<'bitrix' | 'export' | null>(null);

  function close() {
    setOpen(null);
  }

  const triggerClass = layout === 'toolbar' ? TOOLBAR_TRIGGER_BTN_CLASS : PANEL_TRIGGER_BTN_CLASS;
  const triggerWrapClass =
    layout === 'toolbar'
      ? 'flex shrink-0 flex-wrap items-center justify-end gap-1.5 sm:pt-0.5'
      : 'mt-2 grid grid-cols-2 gap-2';

  return (
    <>
      <div className={triggerWrapClass}>
        <button className={triggerClass} onClick={() => setOpen('bitrix')} type="button">
          Bitrix24
        </button>
        <button className={triggerClass} onClick={() => setOpen('export')} type="button">
          Export
        </button>
      </div>

      <WorkspaceModal onClose={close} open={open === 'bitrix'} title="Bitrix24">
        <div className="space-y-4">
          <p className={`${WORKSPACE_BODY_CLASS} text-sm leading-relaxed`}>
            Webhook URL is set in the server environment. The values below are saved for this project
            only.
          </p>
          <BitrixSettingsForm project={project} />
          <div className="border-t border-white/10 pt-4">
            <p className={`${WORKSPACE_BODY_CLASS} text-sm`}>Push tasks to Bitrix (uses webhook).</p>
            <div className="mt-3">
              <SyncToolbar
                bitrixSyncCompleted={project.bitrixSyncCompleted}
                phaseId={activePhaseId}
                projectId={project.id}
              />
            </div>
          </div>
        </div>
      </WorkspaceModal>

      <WorkspaceModal onClose={close} open={open === 'export'} title="Export plan">
        <div className="space-y-4">
          <p className={`${WORKSPACE_BODY_CLASS} text-sm leading-relaxed`}>
            Download the saved plan snapshot for this phase.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <a
              className={`flex-1 ${WORKSPACE_GHOST_BTN_CLASS} text-center text-sm`}
              href={exportMd}
            >
              Markdown
            </a>
            <a
              className={`flex-1 ${WORKSPACE_GHOST_BTN_CLASS} text-center text-sm`}
              href={exportYaml}
            >
              YAML
            </a>
          </div>
        </div>
      </WorkspaceModal>
    </>
  );
}
