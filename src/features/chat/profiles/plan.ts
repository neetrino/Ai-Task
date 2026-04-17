import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { CHAT_MODEL_HISTORY_LIMIT } from '@/features/chat/chat-limits';
import { PLAN_SYSTEM_PROMPT } from '@/features/chat/prompts';
import type { ProfileBuildInput, ProfileBuildResult } from './types';

export function buildPlanProfile(input: ProfileBuildInput): ProfileBuildResult {
  const systemContent = input.priorPlan
    ? `${PLAN_SYSTEM_PROMPT}\n\nCurrent plan JSON:\n${JSON.stringify(input.priorPlan)}`
    : PLAN_SYSTEM_PROMPT;

  const messages: ChatCompletionMessageParam[] = [
    { role: 'system', content: systemContent },
    ...input.history.map((m) => ({
      role: m.role === 'user' ? ('user' as const) : ('assistant' as const),
      content: m.content,
    })),
  ];

  return {
    profile: 'plan',
    messages,
    responseFormat: { type: 'json_object' },
    persistsPlan: true,
    historyLimit: CHAT_MODEL_HISTORY_LIMIT,
  };
}
