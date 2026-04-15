'use client';

import { SyncToolbar } from '@/features/bitrix-sync/SyncToolbar';
import { BitrixSettingsForm } from '@/features/projects/BitrixSettingsForm';
import { WorkspaceModal } from '@/shared/ui/WorkspaceModal';
import { WORKSPACE_BODY_CLASS } from '@/shared/ui/workspace-ui';

export type BitrixSettingsProject = {
  id: string;
  openaiChatModel: string | null;
  bitrixProjectId: string | null;
  taskOwnerId: string | null;
  taskAssigneeId: string | null;
};

export function BitrixProjectSettingsDialog({
  open,
  onClose,
  project,
  activePhaseId,
}: {
  open: boolean;
  onClose: () => void;
  project: BitrixSettingsProject;
  activePhaseId: string | null;
}) {
  return (
    <WorkspaceModal onClose={onClose} open={open} title="Bitrix24">
      <div className="space-y-4">
        <p className={`${WORKSPACE_BODY_CLASS} text-sm leading-relaxed`}>
          Webhook URL is set in the server environment. The values below are saved for this project
          only.
        </p>
        <BitrixSettingsForm project={project} />
        <div className="border-t border-slate-700 pt-4">
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
  );
}
