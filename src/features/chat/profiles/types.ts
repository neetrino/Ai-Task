import type {
  ChatCompletionCreateParams,
  ChatCompletionMessageParam,
} from 'openai/resources/chat/completions';
import type { PlanPayload } from '@/shared/domain/plan';

/**
 * Three context profiles balance how much we send to OpenAI per turn.
 *
 * - `lite`: cheapest path. Short system prompt, last few messages, plain text.
 * - `doc` : same as lite but instructed to use the attached document.
 *           Attachments are embedded into the user message upstream.
 * - `plan`: full planning prompt + prior plan JSON, longer history, JSON
 *           response. This is the only profile that updates `PlanSnapshot`.
 */
export type ContextProfileId = 'lite' | 'doc' | 'plan';

export type ChatHistoryEntry = {
  readonly role: string;
  readonly content: string;
};

/** Inputs every profile builder needs. */
export type ProfileBuildInput = {
  readonly history: readonly ChatHistoryEntry[];
  readonly priorPlan: PlanPayload | undefined;
};

export type ProfileBuildResult = {
  readonly profile: ContextProfileId;
  readonly messages: ChatCompletionMessageParam[];
  /** `undefined` when the profile expects free-form text. */
  readonly responseFormat?: ChatCompletionCreateParams['response_format'];
  /** When true, persist a new PlanSnapshot from the JSON body. */
  readonly persistsPlan: boolean;
  /** Soft cap on history rows the chat-turn loader should fetch. */
  readonly historyLimit: number;
};
