/** Fallback when OPENAI_CHAT_MODEL is unset (must match previous hardcoded default). */
export const OPENAI_CHAT_MODEL_FALLBACK = 'gpt-4o-mini';

/** Suggested model ids for UI datalist — not exhaustive; any valid id can be typed. */
export const OPENAI_CHAT_MODEL_SUGGESTIONS: readonly string[] = [
  'gpt-4o-mini',
  'gpt-4o',
  'gpt-4.1',
  'gpt-4.1-mini',
  'o4-mini',
  'o3-mini',
];

export function getEnvDefaultChatModel(): string {
  const v = process.env.OPENAI_CHAT_MODEL?.trim();
  return v && v.length > 0 ? v : OPENAI_CHAT_MODEL_FALLBACK;
}

export function getEffectiveChatModel(project: { openaiChatModel: string | null }): string {
  const o = project.openaiChatModel?.trim();
  if (o) return o;
  return getEnvDefaultChatModel();
}
