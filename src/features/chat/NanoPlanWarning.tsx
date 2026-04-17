'use client';

/**
 * Inline warning shown under the composer when the user pinned a nano-tier
 * model AND armed planning intent (button or `/plan` command). Doesn't
 * block submit — only nudges them to switch to a stronger model.
 */

import { getModelById } from '@/shared/lib/ai-models';
import type { ModelOverride } from './use-project-model-override';

const PLAN_COMMAND_PATTERN = /(^|\s)\/plan(\s|$)/i;

export function shouldShowNanoPlanWarning(
  effective: ModelOverride,
  planIntentArmed: boolean,
  draft: string,
): boolean {
  if (effective.preset !== 'PINNED') return false;
  if (!effective.pinnedModelId) return false;
  const model = getModelById(effective.pinnedModelId);
  if (!model || model.tier !== 'nano') return false;
  if (planIntentArmed) return true;
  return PLAN_COMMAND_PATTERN.test(draft);
}

export function NanoPlanWarning({
  effective,
  planIntentArmed,
  draft,
}: {
  effective: ModelOverride;
  planIntentArmed: boolean;
  draft: string;
}) {
  if (!shouldShowNanoPlanWarning(effective, planIntentArmed, draft)) return null;
  const model = effective.pinnedModelId ? getModelById(effective.pinnedModelId) : null;
  const label = model?.label ?? 'this model';
  return (
    <div
      className="mt-1 rounded-lg border border-amber-500/30 bg-amber-500/[0.06] px-3 py-1.5 text-[11px] leading-snug text-amber-200"
      role="status"
    >
      You picked {label}. Plan generation works better on GPT-5 mini or higher.
    </div>
  );
}
