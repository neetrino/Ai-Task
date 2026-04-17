/**
 * Single source of truth for OpenAI chat models the platform can call.
 *
 * `tier` groups models by capability/price band so the router can pick a
 * concrete model from a tier without hardcoding ids.
 *
 * `pricing` is per 1M tokens (USD), used for cost reasoning in router
 * heuristics. Treat as approximate — real billing uses recorded usage.
 */

export type ModelTier = 'nano' | 'mini' | 'standard' | 'reasoning';

export type ModelCapabilities = {
  /** Supports OpenAI `response_format: { type: 'json_object' }`. */
  readonly supportsJsonMode: boolean;
  /** Internal chain-of-thought reasoning models (o-series). */
  readonly isReasoning: boolean;
  /** Approximate input context window in tokens. */
  readonly contextWindow: number;
};

export type ModelPricing = {
  /** USD per 1,000,000 prompt tokens. */
  readonly promptPer1M: number;
  /** USD per 1,000,000 completion tokens. */
  readonly completionPer1M: number;
};

export type ChatModel = {
  readonly id: string;
  readonly label: string;
  readonly tier: ModelTier;
  readonly description: string;
  /** Short "when to pick this" hint shown in UI tooltips. */
  readonly bestFor: string;
  readonly pricing: ModelPricing;
  readonly capabilities: ModelCapabilities;
};

/**
 * Curated catalog: exactly one model per tier. Legacy GPT-4 and older
 * o-series models were removed because their newer GPT-5 / o4 counterparts
 * dominate them on price, context window, and quality.
 */
export const CHAT_MODELS: readonly ChatModel[] = [
  {
    id: 'gpt-5-nano',
    label: 'GPT-5 nano',
    tier: 'nano',
    description: 'Fastest, cheapest GPT-5 variant',
    bestFor:
      'Quick replies, classification, simple lookups — when speed and cost matter most.',
    pricing: { promptPer1M: 0.05, completionPer1M: 0.4 },
    capabilities: { supportsJsonMode: true, isReasoning: false, contextWindow: 400_000 },
  },
  {
    id: 'gpt-5-mini',
    label: 'GPT-5 mini',
    tier: 'mini',
    description: 'Balanced GPT-5 — strong quality at moderate cost',
    bestFor:
      'Everyday coding, drafting, summaries — strong quality without flagship pricing.',
    pricing: { promptPer1M: 0.25, completionPer1M: 2.0 },
    capabilities: { supportsJsonMode: true, isReasoning: false, contextWindow: 400_000 },
  },
  {
    id: 'gpt-5',
    label: 'GPT-5',
    tier: 'standard',
    description: 'Flagship GPT-5 — best general quality',
    bestFor:
      'Hard reasoning, deep refactors, long-context tasks — when quality is critical.',
    pricing: { promptPer1M: 1.25, completionPer1M: 10.0 },
    capabilities: { supportsJsonMode: true, isReasoning: false, contextWindow: 400_000 },
  },
  {
    id: 'o4-mini',
    label: 'o4 mini',
    tier: 'reasoning',
    description: 'Reasoning-focused model for decomposition and analysis',
    bestFor:
      'Multi-step planning, decomposition, complex math — slower but deeper thinking.',
    pricing: { promptPer1M: 1.1, completionPer1M: 4.4 },
    capabilities: { supportsJsonMode: true, isReasoning: true, contextWindow: 200_000 },
  },
];

const MODEL_BY_ID: ReadonlyMap<string, ChatModel> = new Map(
  CHAT_MODELS.map((m) => [m.id, m]),
);

export function getModelById(id: string): ChatModel | undefined {
  return MODEL_BY_ID.get(id);
}

export function isKnownModelId(id: string): boolean {
  return MODEL_BY_ID.has(id);
}

/** First model of the given tier; used by presets and tier-fallback. */
export function getDefaultModelForTier(tier: ModelTier): ChatModel {
  const match = CHAT_MODELS.find((m) => m.tier === tier);
  if (!match) {
    throw new Error(`No model registered for tier "${tier}"`);
  }
  return match;
}

export function isReasoningTier(tier: ModelTier): boolean {
  return tier === 'reasoning';
}

export type TierColor = {
  /** Tailwind class for a left-side accent border on list rows (`border-l-2`). */
  readonly border: string;
  /** Tailwind class for a small dot/badge fill (`bg-…/70`). */
  readonly dot: string;
  /** Tailwind class for the label text colour. */
  readonly text: string;
};

const TIER_COLORS: Readonly<Record<ModelTier, TierColor>> = {
  nano: {
    border: 'border-emerald-500/50',
    dot: 'bg-emerald-400/80',
    text: 'text-emerald-300',
  },
  mini: {
    border: 'border-yellow-500/50',
    dot: 'bg-yellow-400/80',
    text: 'text-yellow-200',
  },
  reasoning: {
    border: 'border-amber-500/50',
    dot: 'bg-amber-400/80',
    text: 'text-amber-200',
  },
  standard: {
    border: 'border-rose-500/50',
    dot: 'bg-rose-400/80',
    text: 'text-rose-300',
  },
};

export function getTierColor(tier: ModelTier): TierColor {
  return TIER_COLORS[tier];
}
