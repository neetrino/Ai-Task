import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import type { ProfileBuildInput, ProfileBuildResult } from './types';

const DOC_SYSTEM_PROMPT = [
  'You are a project assistant analysing a document the user attached to this turn.',
  'The attachment is embedded inside <attachments>…</attachments> in the latest user message.',
  'Ground your answer in the attached document; cite filenames or sections when useful.',
  'Answer in plain prose. Do NOT generate task lists, epics, or JSON unless the user asks for them.',
].join(' ');

/** Slightly larger window than lite to keep doc Q&A coherent. */
export const DOC_HISTORY_LIMIT = 10;

export function buildDocProfile(input: ProfileBuildInput): ProfileBuildResult {
  const messages: ChatCompletionMessageParam[] = [
    { role: 'system', content: DOC_SYSTEM_PROMPT },
    ...input.history.map((m) => ({
      role: m.role === 'user' ? ('user' as const) : ('assistant' as const),
      content: m.content,
    })),
  ];

  return {
    profile: 'doc',
    messages,
    persistsPlan: false,
    historyLimit: DOC_HISTORY_LIMIT,
  };
}
