/**
 * Deterministic detector that picks one of three context profiles for the
 * upcoming chat turn. Runs server-side per request, before the OpenAI call.
 *
 * Signals (in priority order):
 *   1. Explicit user intent — `/plan` command or "Update plan" button →
 *      `plan`.
 *   2. Attached files on this turn → `doc`.
 *   3. Otherwise → `lite`.
 *
 * Keep this pure and free of I/O so it can be reused inside the router.
 */

import type { ContextProfileId } from '@/features/chat/profiles';

const PLAN_COMMAND_PATTERN = /(^|\s)\/plan(\s|$)/i;

const PLAN_KEYWORD_PATTERNS: readonly RegExp[] = [
  /\bupdate\s+(the\s+)?plan\b/i,
  /\bcreate\s+(tasks|the\s+plan|epics)\b/i,
  /\bgenerate\s+(tasks|the\s+plan|epics)\b/i,
  /\bbreak\s+(it|this|down|into)\b/i,
  /\b(re)?decompose\b/i,
  // Russian / cyrillic intents — common phrasings used in this product.
  // `\b` is ASCII-only in JS regex so we use start/whitespace anchors.
  /(^|\s)обнови(ть)?\s+план/iu,
  /(^|\s)создай\s+(задачи|план|эпики)/iu,
  /(^|\s)разложи($|\s)/iu,
  /(^|\s)разбей\s+на\s+(задачи|этапы)/iu,
];

export type ProfileSignals = {
  /** Trimmed user message body (without attachments wrapper). */
  readonly message: string;
  /** Number of attachments embedded into the user message this turn. */
  readonly attachmentCount: number;
  /**
   * When true, caller (UI button or API client) explicitly requested a plan
   * update. Always wins over heuristics.
   */
  readonly explicitPlanIntent: boolean;
};

export type ProfileDecision = {
  readonly profile: ContextProfileId;
  /** Short tag for logging and UI badges. */
  readonly reason:
    | 'explicit-plan'
    | 'plan-command'
    | 'plan-keyword'
    | 'has-attachments'
    | 'default-lite';
};

function matchesPlanKeyword(message: string): boolean {
  return PLAN_KEYWORD_PATTERNS.some((re) => re.test(message));
}

export function detectContextProfile(signals: ProfileSignals): ProfileDecision {
  if (signals.explicitPlanIntent) {
    return { profile: 'plan', reason: 'explicit-plan' };
  }
  if (PLAN_COMMAND_PATTERN.test(signals.message)) {
    return { profile: 'plan', reason: 'plan-command' };
  }
  if (matchesPlanKeyword(signals.message)) {
    return { profile: 'plan', reason: 'plan-keyword' };
  }
  if (signals.attachmentCount > 0) {
    return { profile: 'doc', reason: 'has-attachments' };
  }
  return { profile: 'lite', reason: 'default-lite' };
}

/**
 * Strips a leading or surrounding `/plan` token so the LLM does not see the
 * routing command in the user message. Whitespace is collapsed.
 */
export function stripPlanCommand(message: string): string {
  return message.replace(PLAN_COMMAND_PATTERN, ' ').replace(/\s+/g, ' ').trim();
}
