import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import type { ProfileBuildInput, ProfileBuildResult } from './types';

const LITE_SYSTEM_PROMPT = [
  'You are a project assistant.',
  'Answer in plain prose. Keep replies concise and on-topic.',
  'Do NOT generate task lists, epics, or JSON unless the user asks for them.',
].join(' ');

/** History rows kept short to minimise prompt cost on chit-chat. */
export const LITE_HISTORY_LIMIT = 8;

export function buildLiteProfile(input: ProfileBuildInput): ProfileBuildResult {
  const messages: ChatCompletionMessageParam[] = [
    { role: 'system', content: LITE_SYSTEM_PROMPT },
    ...input.history.map((m) => ({
      role: m.role === 'user' ? ('user' as const) : ('assistant' as const),
      content: m.content,
    })),
  ];

  return {
    profile: 'lite',
    messages,
    persistsPlan: false,
    historyLimit: LITE_HISTORY_LIMIT,
  };
}
