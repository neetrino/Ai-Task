/**
 * Deterministic model selector. Given the user's preset (or pinned model)
 * plus the upstream profile decision, returns the concrete model the chat
 * turn should call.
 *
 * Pure function — no I/O, no DB. The caller passes whatever budget pressure
 * signal it computed (Étape 6 wires it).
 */

import {
  type ChatModel,
  getDefaultModelForTier,
  getModelById,
  type ModelPreset,
  type ModelTier,
} from '@/shared/lib/ai-models';
import type { ContextProfileId } from '@/features/chat/profiles';
import type { ProfileDecision } from './context-profile';

/**
 * Soft signal that the user / project is approaching its monthly token cap.
 * - `none`     : full quality available.
 * - `soft-warn`: ≥80% used → router downgrades one tier to slow burn.
 * - `over-cap` : 100% reached → caller should reject before this point;
 *                router still emits a nano-tier choice as a defensive default.
 */
export type BudgetPressure = 'none' | 'soft-warn' | 'over-cap';

export type RouterInput = {
  readonly preset: ModelPreset;
  readonly pinnedModelId: string | null;
  readonly profileDecision: ProfileDecision;
  readonly messageLength: number;
  readonly attachmentCount: number;
  readonly budgetPressure: BudgetPressure;
};

export type RouterDecision = {
  readonly model: ChatModel;
  readonly profile: ContextProfileId;
  /** Short structured tag describing why this model was picked. */
  readonly reason:
    | 'pinned'
    | 'preset-economy'
    | 'preset-balanced'
    | 'preset-quality'
    | 'auto-plan'
    | 'auto-doc'
    | 'auto-lite'
    | 'budget-downgrade';
};

const TIER_ORDER: readonly ModelTier[] = ['nano', 'mini', 'standard', 'reasoning'];

function downgradeTier(tier: ModelTier): ModelTier {
  // `reasoning` is a side-tier (not strictly more expensive than standard for
  // every model), but cheaper-leaning fallback is `standard`.
  if (tier === 'reasoning') return 'standard';
  const idx = TIER_ORDER.indexOf(tier);
  if (idx <= 0) return 'nano';
  return TIER_ORDER[idx - 1];
}

function pickAutoTier(profile: ContextProfileId): ModelTier {
  switch (profile) {
    case 'plan':
      return 'standard';
    case 'doc':
      return 'mini';
    case 'lite':
      return 'nano';
  }
}

function pickQualityTier(profile: ContextProfileId): ModelTier {
  // Quality preset always favours capability; only chit-chat uses mini.
  return profile === 'lite' ? 'mini' : 'standard';
}

function pinnedModelOrNull(pinnedModelId: string | null): ChatModel | null {
  if (!pinnedModelId) return null;
  return getModelById(pinnedModelId) ?? null;
}

export function pickModelAndProfile(input: RouterInput): RouterDecision {
  const profile = input.profileDecision.profile;

  if (input.preset === 'PINNED') {
    const pinned = pinnedModelOrNull(input.pinnedModelId);
    if (pinned) {
      return { model: pinned, profile, reason: 'pinned' };
    }
    // Fall through to AUTO behaviour if the pinned id is unknown.
  }

  let tier: ModelTier;
  let reason: RouterDecision['reason'];
  switch (input.preset) {
    case 'ECONOMY':
      tier = 'nano';
      reason = 'preset-economy';
      break;
    case 'BALANCED':
      tier = 'mini';
      reason = 'preset-balanced';
      break;
    case 'QUALITY':
      tier = pickQualityTier(profile);
      reason = 'preset-quality';
      break;
    case 'AUTO':
    case 'PINNED':
    default:
      tier = pickAutoTier(profile);
      reason =
        profile === 'plan' ? 'auto-plan' : profile === 'doc' ? 'auto-doc' : 'auto-lite';
      break;
  }

  if (input.budgetPressure === 'soft-warn' || input.budgetPressure === 'over-cap') {
    const cheaper = downgradeTier(tier);
    if (cheaper !== tier) {
      return {
        model: getDefaultModelForTier(cheaper),
        profile,
        reason: 'budget-downgrade',
      };
    }
  }

  return {
    model: getDefaultModelForTier(tier),
    profile,
    reason,
  };
}
