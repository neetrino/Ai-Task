/**
 * @deprecated Use `@/shared/lib/ai-models` (catalog + presets) and
 * `@/features/ai-router` for model selection. This module is kept as a thin
 * shim for legacy callers (project queries, account/settings UI) until the
 * preset migration is fully rolled out.
 */

import {
  CHAT_MODELS,
  getDefaultModelForTier,
  isKnownModelId as catalogIsKnown,
} from './ai-models/catalog';

export const DEFAULT_CHAT_MODEL_ID: string = getDefaultModelForTier('nano').id;

export type OpenAiChatModelOption = {
  readonly id: string;
  readonly label: string;
  readonly description: string;
};

export const OPENAI_CHAT_MODEL_OPTIONS: readonly OpenAiChatModelOption[] = CHAT_MODELS.map(
  (m) => ({ id: m.id, label: m.label, description: m.description }),
);

export function isAllowedChatModelId(id: string): boolean {
  return catalogIsKnown(id);
}

export function getEffectiveChatModel(project: { openaiChatModel: string | null }): string {
  const o = project.openaiChatModel?.trim();
  if (o && catalogIsKnown(o)) return o;
  return DEFAULT_CHAT_MODEL_ID;
}
