import { SyncToolbar } from '@/features/bitrix-sync/SyncToolbar';
import { PhaseCreateForm } from '@/features/phases/PhaseCreateForm';
import { BitrixSettingsForm } from '@/features/projects/BitrixSettingsForm';
import { ChatModelForm } from '@/features/projects/ChatModelForm';
import { PlanEditor } from '@/features/plan-editor/PlanEditor';
import type { PlanPayload } from '@/shared/domain/plan';
import { WORKSPACE_BODY_CLASS, WORKSPACE_GHOST_BTN_CLASS } from '@/shared/ui/workspace-ui';

const DETAILS_CLASS =
  'rounded-xl border border-white/10 bg-slate-950/40 p-3 [&_summary]:list-none [&_summary::-webkit-details-marker]:hidden';
const SUMMARY_CLASS = 'cursor-pointer text-sm font-medium text-slate-200 hover:text-white';

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
  plan,
}: {
  project: ProjectForSettings;
  exportMd: string;
  exportYaml: string;
  activePhaseId: string | null;
  plan: PlanPayload;
}) {
  return (
    <aside className="flex max-h-[min(100vh-8rem,900px)] min-h-0 flex-col gap-2 overflow-y-auto pr-1">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Setup</p>
      <details className={DETAILS_CLASS}>
        <summary className={SUMMARY_CLASS}>New phase</summary>
        <p className={`mt-2 ${WORKSPACE_BODY_CLASS} text-xs`}>
          Add an iteration; each phase has its own chat history and plan snapshot.
        </p>
        <div className="mt-3">
          <PhaseCreateForm projectId={project.id} />
        </div>
      </details>
      <details className={DETAILS_CLASS}>
        <summary className={SUMMARY_CLASS}>AI model</summary>
        <div className="mt-3">
          <ChatModelForm project={project} />
        </div>
      </details>
      <details className={DETAILS_CLASS}>
        <summary className={SUMMARY_CLASS}>Bitrix24</summary>
        <p className={`mt-2 ${WORKSPACE_BODY_CLASS} text-xs`}>
          Webhook stays in server env; ids are stored per project.
        </p>
        <div className="mt-3">
          <BitrixSettingsForm project={project} />
        </div>
      </details>
      <details className={DETAILS_CLASS}>
        <summary className={SUMMARY_CLASS}>Export & sync</summary>
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
      <details className={DETAILS_CLASS}>
        <summary className={SUMMARY_CLASS}>Advanced · plan JSON</summary>
        <p className={`mt-2 ${WORKSPACE_BODY_CLASS} text-xs`}>
          Edit raw plan if needed; chat usually updates this automatically.
        </p>
        <div className="mt-3">
          <PlanEditor embedded initialPlan={plan} phaseId={activePhaseId} projectId={project.id} />
        </div>
      </details>
    </aside>
  );
}
