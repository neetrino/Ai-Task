import { buildDocProfile, DOC_HISTORY_LIMIT } from './doc';
import { buildLiteProfile, LITE_HISTORY_LIMIT } from './lite';
import { buildPlanProfile } from './plan';
import type { ContextProfileId, ProfileBuildInput, ProfileBuildResult } from './types';
import { CHAT_MODEL_HISTORY_LIMIT } from '@/features/chat/chat-limits';

export type { ContextProfileId, ProfileBuildInput, ProfileBuildResult } from './types';
export { buildDocProfile, DOC_HISTORY_LIMIT } from './doc';
export { buildLiteProfile, LITE_HISTORY_LIMIT } from './lite';
export { buildPlanProfile } from './plan';

export function buildProfile(
  profile: ContextProfileId,
  input: ProfileBuildInput,
): ProfileBuildResult {
  switch (profile) {
    case 'lite':
      return buildLiteProfile(input);
    case 'doc':
      return buildDocProfile(input);
    case 'plan':
      return buildPlanProfile(input);
  }
}

/**
 * Upper bound on history rows the chat-turn loader needs to fetch for the
 * given profile. Used before the builder is called to keep the SQL `take`
 * tight.
 */
export function getHistoryLimitForProfile(profile: ContextProfileId): number {
  switch (profile) {
    case 'lite':
      return LITE_HISTORY_LIMIT;
    case 'doc':
      return DOC_HISTORY_LIMIT;
    case 'plan':
      return CHAT_MODEL_HISTORY_LIMIT;
  }
}
