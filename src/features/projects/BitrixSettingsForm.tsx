import { updateProjectBitrix } from '@/features/projects/project-actions';
import {
  WORKSPACE_ACCENT_BTN_CLASS,
  WORKSPACE_FIELD_CLASS,
  WORKSPACE_LABEL_CLASS,
} from '@/shared/ui/workspace-ui';

type ProjectBitrixFields = {
  id: string;
  bitrixProjectId: string | null;
  taskOwnerId: string | null;
  taskAssigneeId: string | null;
};

export function BitrixSettingsForm({ project }: { project: ProjectBitrixFields }) {
  return (
    <form
      action={updateProjectBitrix.bind(null, project.id)}
      className="flex min-w-0 flex-col gap-4"
    >
      <div className="flex min-w-0 flex-col gap-4">
        <label className="flex min-w-0 flex-col gap-1.5" htmlFor="bitrixProjectId">
          <span className={WORKSPACE_LABEL_CLASS}>Project or group</span>
          <span className="text-xs leading-snug text-slate-500">
            Where new tasks are created (numeric ID in Bitrix).
          </span>
          <input
            className={`min-w-0 ${WORKSPACE_FIELD_CLASS}`}
            defaultValue={project.bitrixProjectId ?? ''}
            id="bitrixProjectId"
            name="bitrixProjectId"
            placeholder="e.g. 425"
            title="Bitrix project / group id"
            type="text"
          />
        </label>
        <label className="flex min-w-0 flex-col gap-1.5" htmlFor="taskOwnerId">
          <span className={WORKSPACE_LABEL_CLASS}>Task creator</span>
          <span className="text-xs leading-snug text-slate-500">
            Shown as the author of tasks created from this project.
          </span>
          <input
            className={`min-w-0 ${WORKSPACE_FIELD_CLASS}`}
            defaultValue={project.taskOwnerId ?? ''}
            id="taskOwnerId"
            name="taskOwnerId"
            placeholder="User ID"
            title="Bitrix field: CREATED_BY"
            type="text"
          />
        </label>
        <label className="flex min-w-0 flex-col gap-1.5" htmlFor="taskAssigneeId">
          <span className={WORKSPACE_LABEL_CLASS}>Default assignee</span>
          <span className="text-xs leading-snug text-slate-500">
            Who gets the task by default when it is synced.
          </span>
          <input
            className={`min-w-0 ${WORKSPACE_FIELD_CLASS}`}
            defaultValue={project.taskAssigneeId ?? ''}
            id="taskAssigneeId"
            name="taskAssigneeId"
            placeholder="User ID"
            title="Bitrix field: RESPONSIBLE_ID"
            type="text"
          />
        </label>
      </div>
      <div className="flex justify-end pt-1">
        <button className={WORKSPACE_ACCENT_BTN_CLASS} type="submit">
          Save settings
        </button>
      </div>
    </form>
  );
}
