import { SyncToolbar } from '@/features/bitrix-sync/SyncToolbar';
import { BitrixSettingsForm } from '@/features/projects/BitrixSettingsForm';
import { SETUP_DETAILS_CLASS, SETUP_SUMMARY_CLASS } from '@/features/projects/setup-panel-classes';
import { WORKSPACE_BODY_CLASS, WORKSPACE_GHOST_BTN_CLASS } from '@/shared/ui/workspace-ui';

type ProjectForSettings = {
  id: string;
  openaiChatModel: string | null;
  bitrixProjectId: string | null;
  taskOwnerId: string | null;
  taskAssigneeId: string | null;
};

export function ProjectSettingsAside({
  project,
  exportMd,
  exportYaml,
  activePhaseId,
}: {
  project: ProjectForSettings;
  exportMd: string;
  exportYaml: string;
  activePhaseId: string | null;
}) {
  return (
    <aside className="flex max-h-[min(100vh-8rem,900px)] min-h-0 flex-col gap-2 overflow-y-auto pr-1">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Setup</p>
      <details className={SETUP_DETAILS_CLASS}>
        <summary className={SETUP_SUMMARY_CLASS}>Bitrix24</summary>
        <p className={`mt-2 ${WORKSPACE_BODY_CLASS} text-xs leading-relaxed`}>
          Webhook URL is set in the server environment. The values below are saved for this project
          only.
        </p>
        <div className="mt-3">
          <BitrixSettingsForm project={project} />
        </div>
      </details>
      <details className={SETUP_DETAILS_CLASS}>
        <summary className={SETUP_SUMMARY_CLASS}>Export & sync</summary>
        <div className="mt-3 flex flex-col gap-4">
          <div>
            <p className={`${WORKSPACE_BODY_CLASS} text-xs`}>Download saved plan for this phase.</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <a className={`${WORKSPACE_GHOST_BTN_CLASS} text-xs`} href={exportMd}>
                Markdown
              </a>
              <a className={`${WORKSPACE_GHOST_BTN_CLASS} text-xs`} href={exportYaml}>
                YAML
              </a>
            </div>
          </div>
          <div>
            <p className={`${WORKSPACE_BODY_CLASS} text-xs`}>Push tasks to Bitrix (uses webhook).</p>
            <div className="mt-2">
              <SyncToolbar phaseId={activePhaseId} projectId={project.id} />
            </div>
          </div>
        </div>
      </details>
    </aside>
  );
}
