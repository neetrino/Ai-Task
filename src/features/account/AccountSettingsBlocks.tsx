import { AccountPlanEditorSection } from '@/features/account/AccountPlanEditorSection';
import {
  ACCOUNT_DETAILS_CLASS,
  ACCOUNT_SUMMARY_CHEVRON_CLASS,
  ACCOUNT_SUMMARY_ROW_CLASS,
} from '@/features/account/account-settings-classes';
import { BudgetIndicator } from '@/features/billing/BudgetIndicator';
import type { BudgetSnapshot } from '@/features/billing/token-budget';
import { ChatModelForm } from '@/features/projects/ChatModelForm';
import type { PlanPayload } from '@/shared/domain/plan-defaults';
import type { ModelPreset } from '@/shared/lib/ai-models';
import { WORKSPACE_BODY_CLASS } from '@/shared/ui/workspace-ui';

type ProjectModel = {
  id: string;
  modelPreset: ModelPreset;
  pinnedModelId: string | null;
};

export function AccountSettingsBlocks({
  project,
  activePhaseId,
  plan,
  budget,
}: {
  project: ProjectModel;
  activePhaseId: string | null;
  plan: PlanPayload;
  budget: BudgetSnapshot;
}) {
  return (
    <div className="flex flex-col gap-3">
      <details className={ACCOUNT_DETAILS_CLASS} open>
        <summary className={ACCOUNT_SUMMARY_ROW_CLASS}>
          <span>AI model</span>
          <span aria-hidden className={ACCOUNT_SUMMARY_CHEVRON_CLASS}>
            ▼
          </span>
        </summary>
        <p className={`mt-2 ${WORKSPACE_BODY_CLASS} text-xs`}>
          Model used for AI chat in this project. Saved per project, not per phase.
        </p>
        <div className="mt-3 flex flex-col gap-3">
          <BudgetIndicator snapshot={budget} />
          <ChatModelForm key={project.id} project={project} />
        </div>
      </details>

      <AccountPlanEditorSection
        initialPlan={plan}
        phaseId={activePhaseId}
        projectId={project.id}
      />
    </div>
  );
}
