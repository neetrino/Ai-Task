'use client';

import { useState } from 'react';
import { SyncToolbar } from '@/features/bitrix-sync/SyncToolbar';
import { BitrixSettingsForm } from '@/features/projects/BitrixSettingsForm';
import { WorkspaceModal } from '@/shared/ui/WorkspaceModal';
import { WORKSPACE_BODY_CLASS } from '@/shared/ui/workspace-ui';

/** Compact actions in the project header toolbar */
const TOOLBAR_TRIGGER_BTN_CLASS =
  'shrink-0 rounded-lg border border-white/12 bg-white/[0.05] px-2.5 py-1.5 text-center text-xs font-medium text-slate-200 transition hover:border-violet-400/35 hover:bg-white/[0.08] hover:text-white';

/** Fixed strip on the viewport right — stacked vertically */
const EDGE_TRIGGER_BTN_CLASS =
  'w-full min-w-[5.25rem] rounded-lg border border-white/12 bg-slate-950/90 px-2 py-2 text-center text-[11px] font-medium leading-tight text-slate-200 shadow-lg shadow-black/40 backdrop-blur-md transition hover:border-violet-400/35 hover:bg-slate-900/95 hover:text-white sm:min-w-[5.5rem] sm:text-xs';

const PANEL_TRIGGER_BTN_CLASS =
  'w-full rounded-lg border border-white/15 bg-white/[0.06] px-3 py-2.5 text-center text-xs font-medium text-slate-100 transition hover:border-violet-400/40 hover:bg-white/[0.09] hover:text-white';

type ProjectForSettings = {
  id: string;
  openaiChatModel: string | null;
  bitrixProjectId: string | null;
  taskOwnerId: string | null;
  taskAssigneeId: string | null;
};

export function ProjectBitrixSetupPanel({
  project,
  activePhaseId,
  layout = 'toolbar',
}: {
  project: ProjectForSettings;
  activePhaseId: string | null;
  layout?: 'toolbar' | 'panel' | 'edge';
}) {
  const [open, setOpen] = useState(false);

  function close() {
    setOpen(false);
  }

  const triggerClass =
    layout === 'edge'
      ? EDGE_TRIGGER_BTN_CLASS
      : layout === 'toolbar'
        ? TOOLBAR_TRIGGER_BTN_CLASS
        : PANEL_TRIGGER_BTN_CLASS;
  const triggerWrapClass =
    layout === 'edge'
      ? 'pointer-events-none fixed right-3 top-1/2 z-30 flex -translate-y-1/2 flex-col gap-2 max-lg:bottom-28 max-lg:top-auto max-lg:translate-y-0 sm:right-4'
      : layout === 'toolbar'
        ? 'flex shrink-0 flex-wrap items-center justify-end gap-1.5 sm:pt-0.5'
        : 'mt-2';

  return (
    <>
      <div className={triggerWrapClass}>
        <button
          className={`${triggerClass} pointer-events-auto`}
          onClick={() => setOpen(true)}
          type="button"
        >
          Bitrix24
        </button>
      </div>

      <WorkspaceModal onClose={close} open={open} title="Bitrix24">
        <div className="space-y-4">
          <p className={`${WORKSPACE_BODY_CLASS} text-sm leading-relaxed`}>
            Webhook URL is set in the server environment. The values below are saved for this project
            only.
          </p>
          <BitrixSettingsForm project={project} />
          <div className="border-t border-white/10 pt-4">
            <p className={`${WORKSPACE_BODY_CLASS} text-sm`}>
              After saving settings, run a dry-run to validate the webhook and plan (nothing is created in
              Bitrix).
            </p>
            <div className="mt-3">
              <SyncToolbar phaseId={activePhaseId} projectId={project.id} variant="dryRunOnly" />
            </div>
          </div>
        </div>
      </WorkspaceModal>
    </>
  );
}
