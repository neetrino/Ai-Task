'use client';

import { useState } from 'react';
import { ProjectAttachmentsList } from '@/features/projects/ProjectAttachmentsList';
import { WORKSPACE_BODY_CLASS } from '@/shared/ui/workspace-ui';
import { WorkspaceModal } from '@/shared/ui/WorkspaceModal';

type SettingsTab = 'general' | 'files';

const TAB_BTN_BASE =
  'rounded-md px-3 py-1.5 text-xs font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/30';

const TAB_BTN_ACTIVE = `${TAB_BTN_BASE} border border-white/[0.08] bg-neutral-800 text-neutral-100`;

const TAB_BTN_IDLE = `${TAB_BTN_BASE} border border-transparent text-neutral-400 hover:bg-white/[0.04] hover:text-neutral-200`;

export function ProjectSettingsDialog({
  open,
  onClose,
  projectSlug,
}: {
  open: boolean;
  onClose: () => void;
  projectSlug: string;
}) {
  const [tab, setTab] = useState<SettingsTab>('general');

  return (
    <WorkspaceModal onClose={onClose} open={open} title="Settings">
      <div className="space-y-4">
        <div className="flex gap-1">
          <button
            className={tab === 'general' ? TAB_BTN_ACTIVE : TAB_BTN_IDLE}
            onClick={() => setTab('general')}
            type="button"
          >
            General
          </button>
          <button
            className={tab === 'files' ? TAB_BTN_ACTIVE : TAB_BTN_IDLE}
            onClick={() => setTab('files')}
            type="button"
          >
            Files
          </button>
        </div>

        {tab === 'general' ? (
          <p className={`${WORKSPACE_BODY_CLASS} leading-relaxed`}>
            Project-level settings will appear here (chat model, behavior). Coming soon.
          </p>
        ) : (
          <ProjectAttachmentsList projectSlug={projectSlug} />
        )}
      </div>
    </WorkspaceModal>
  );
}
