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

// Unicode-aware word boundaries. JS `\b` is ASCII-only, so for Cyrillic /
// Armenian we anchor on a non-letter char (or string edge). Used with the `u`
// flag so `\p{L}` matches letters from any script.
const WB_START = '(?:^|[^\\p{L}])';
const WB_END = '(?=$|[^\\p{L}])';

const PLAN_KEYWORD_PATTERNS: readonly RegExp[] = [
  // English — broadened: "make/add/draft/build/write/create … plan/tasks/…"
  /\bupdate\s+(the\s+)?plan\b/i,
  /\b(create|make|add|draft|build|write|generate)\s+(a\s+|the\s+)?(plan|tasks?|epics?|backlog|to-?dos?|to-?do\s+list)\b/i,
  /\b(let'?s|lets)\s+(plan|draft|build|sketch|outline)\b/i,
  /\bsplit\s+(it|this)?\s*into\s+(tasks?|epics?|steps?|phases?)\b/i,
  /\bbreak\s+(it|this|down|into)\b/i,
  /\b(re)?decompose\b/i,

  // Russian — Cyrillic. Imperative verbs + plan-related noun.
  new RegExp(
    `${WB_START}(обнови(ть)?|сделай|создай|сформируй|набросай|составь|распиши|накидай|распланируй|запиши|разложи|разбей)\\s+(на\\s+)?(задач[аиуы]+|план(ом|а|у|е)?|эпик[иа]?|тудушк[аи]+|бэклог[ауе]?|этап[аыы]+|todo|to-?do)`,
    'iu',
  ),

  // Russian — Latin transliteration.
  new RegExp(
    `${WB_START}(obnovi(t')?|sdelay|sdelai|sdelaj|sozday|sozdai|sozdaj|sformiruy|sformiruj|nakidai|nakiday|sostav'?|raspishi|raspredeli|razlozhi|razbey|razbei|raspl?aniruy)\\s+(na\\s+)?(zadach[aiuy]*|plan[aueom]*|epik[ia]?|backlog[aue]?|etap[ay]*|todo|to-?do|tudush?k[aie]*)${WB_END}`,
    'iu',
  ),

  // Armenian — Unicode script.
  new RegExp(
    `${WB_START}(սարքիր|ստեղծիր|ստեղծի|կազմիր|գրիր|նկարագրիր|թարմացրու)\\s+(առաջադրանք(ներ)?|պլան[աիյ]*|խնդիր(ներ)?|էտապ(ներ)?|todo|to-?do)`,
    'iu',
  ),

  // Armenian — Latin transliteration.
  new RegExp(
    `${WB_START}(sarkir|stex[cç]i|stextsi|steghtsi|kazmir|grir|nkaragrir|tarmacru)\\s+(arajadrank(ner)?|plan[ai]*|xndir(ner)?|khndir(ner)?|etap(ner)?|todo|to-?do)${WB_END}`,
    'iu',
  ),
];

/**
 * Lightweight imperative / command-tone marker. Used by the router gate to
 * decide whether to bother the LLM classifier on short messages that the
 * deterministic detector dropped to `lite`. NOT used to set the profile on
 * its own — it just signals "this looks like a command, worth a closer look".
 */
export const IMPERATIVE_MARKERS_PATTERN = new RegExp(
  [
    // English imperatives / softeners.
    `${WB_START}(let'?s|lets|please|pls|make|create|add|build|draft|write|generate|setup|set\\s*up|do|update)${WB_END}`,
    // Russian — Cyrillic.
    `${WB_START}(давай(те)?|пожалуйста|плиз|сделай|создай|сформируй|набросай|составь|распиши|накидай|распланируй|обнови(ть)?|разложи|разбей|запили)${WB_END}`,
    // Russian — Latin transliteration.
    `${WB_START}(davay|davai|pozhalu(y|j)sta|pliz|sdelay|sdelai|sdelaj|sozday|sozdai|sozdaj|nakidai|nakiday|sostav'?|raspishi|sformiruy|sformiruj|obnovi(t')?|razlozhi|razbey|razbei|zapili)${WB_END}`,
    // Armenian — Unicode.
    `${WB_START}(արա|սարքիր|ստեղծիր|ստեղծի|կազմիր|գրիր|թարմացրու|խնդրում\\s+եմ)${WB_END}`,
    // Armenian — Latin transliteration.
    `${WB_START}(ara|sarkir|stex[cç]i|stextsi|kazmir|grir|tarmacru|xndrum\\s+em|khndrum\\s+em)${WB_END}`,
  ].join('|'),
  'iu',
);

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
