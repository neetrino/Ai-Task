/**
 * LLM fallback classifier for the router. Used only when the deterministic
 * detector returns the default `lite` profile but the message looks
 * ambiguous (long, contains code, lots of bullet points, …).
 *
 * Calls `gpt-5-nano` with an aggressive 800 ms timeout. On timeout / error /
 * malformed response we silently fall back to the deterministic decision,
 * so this layer can never break the chat path.
 */

import { logger } from '@/shared/lib/logger';
import { getOpenAI } from '@/shared/lib/openai';
import type { ContextProfileId } from '@/features/chat/profiles';
import { IMPERATIVE_MARKERS_PATTERN } from './context-profile';
import {
  getRouterCache,
  makeRouterCacheKey,
  setRouterCache,
} from './router-cache';

const CLASSIFIER_MODEL = 'gpt-5-nano';
const CLASSIFIER_TIMEOUT_MS = 800;

const SYSTEM_PROMPT = [
  'Classify the user message into ONE of three context profiles for a project planning assistant:',
  '- "plan": user wants to create / update a backlog of tasks, epics, or a structured plan.',
  '- "doc": user is asking about an attached document.',
  '- "lite": casual chat, short question, greeting, status update, anything else.',
  '',
  'Messages may be in English, Russian (Cyrillic OR Latin transliteration), or Armenian (Armenian script OR Latin transliteration). Treat transliteration as the original language.',
  'Examples of "plan" intent:',
  '- "create tasks for auth", "let\'s draft a backlog", "split this into steps".',
  '- "сделай задачи по этому", "накидай план на неделю", "разбей на этапы".',
  '- "sdelay zadachi po etomu", "nakidai plan na nedelyu", "obnovi plan".',
  '- "սարքիր առաջադրանքներ", "կազմիր պլան".',
  '- "sarkir arajadrankner", "kazmir plan".',
  'Examples of "lite": "привет", "spasibo", "ok cool", "what time is it?".',
  '',
  'Respond with a JSON object: {"profile":"plan"|"doc"|"lite","confidence":0..1}.',
  'Default to "lite" when unsure.',
].join('\n');

/**
 * Heuristic gate: if the deterministic detector is confident enough we skip
 * the LLM call entirely. We only ask the classifier when the deterministic
 * answer is `lite` AND the message either:
 *   - contains an imperative / command marker (cheap to recognise even when
 *     the user uses Latin transliteration of Russian/Armenian we can't catch
 *     with the keyword regex), OR
 *   - is long enough (> 60 chars) to plausibly carry planning intent.
 *
 * Pure greetings and acknowledgements (< 15 chars trimmed) never trigger.
 */
export function shouldUseLlmClassifier(input: {
  deterministicProfile: ContextProfileId;
  message: string;
  attachmentCount: number;
}): boolean {
  if (input.deterministicProfile !== 'lite') return false;
  if (input.attachmentCount > 0) return false;
  const trimmed = input.message.trim();
  if (trimmed.length < 15) return false;
  if (IMPERATIVE_MARKERS_PATTERN.test(trimmed)) return true;
  return trimmed.length > 60;
}

type ClassifierOutput = {
  profile: ContextProfileId;
  confidence: number;
};

function parseClassifierJson(raw: string): ClassifierOutput | null {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return null;
    const obj = parsed as Record<string, unknown>;
    const profile = obj.profile;
    const confidence = obj.confidence;
    if (profile !== 'plan' && profile !== 'doc' && profile !== 'lite') return null;
    if (typeof confidence !== 'number' || !Number.isFinite(confidence)) return null;
    return { profile, confidence: Math.max(0, Math.min(1, confidence)) };
  } catch {
    return null;
  }
}

/**
 * Calls the classifier with a hard timeout. Returns `null` on any failure
 * so callers can fall back to the deterministic decision.
 */
export async function classifyMessageWithLlm(input: {
  message: string;
  attachmentCount: number;
}): Promise<ClassifierOutput | null> {
  const cacheKey = makeRouterCacheKey(input);
  const cached = getRouterCache<ClassifierOutput>(cacheKey);
  if (cached) return cached;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CLASSIFIER_TIMEOUT_MS);

  try {
    const completion = await getOpenAI().chat.completions.create(
      {
        model: CLASSIFIER_MODEL,
        response_format: { type: 'json_object' },
        // Keep the prompt tiny — body cost is the whole point of the gate.
        max_tokens: 60,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: input.message.slice(0, 2000),
          },
        ],
      },
      { signal: controller.signal },
    );
    const text = completion.choices[0]?.message?.content;
    if (!text) return null;
    const parsed = parseClassifierJson(text);
    if (!parsed) return null;
    setRouterCache(cacheKey, parsed);
    return parsed;
  } catch (err) {
    if (controller.signal.aborted) {
      logger.warn({ ms: CLASSIFIER_TIMEOUT_MS }, 'LLM classifier timed out; falling back');
      return null;
    }
    logger.warn({ err }, 'LLM classifier failed; falling back');
    return null;
  } finally {
    clearTimeout(timer);
  }
}
