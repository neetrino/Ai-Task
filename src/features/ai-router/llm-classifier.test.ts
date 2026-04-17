import { beforeEach, describe, expect, it } from 'vitest';
import { shouldUseLlmClassifier } from '@/features/ai-router/llm-classifier';
import {
  _resetRouterCacheForTests,
  getRouterCache,
  makeRouterCacheKey,
  setRouterCache,
} from '@/features/ai-router/router-cache';

beforeEach(() => {
  _resetRouterCacheForTests();
});

describe('shouldUseLlmClassifier', () => {
  it('skips when deterministic profile is not lite', () => {
    expect(
      shouldUseLlmClassifier({
        deterministicProfile: 'plan',
        message: 'a'.repeat(800),
        attachmentCount: 0,
      }),
    ).toBe(false);
  });

  it('skips when there are attachments (already doc)', () => {
    expect(
      shouldUseLlmClassifier({
        deterministicProfile: 'lite',
        message: 'a'.repeat(800),
        attachmentCount: 2,
      }),
    ).toBe(false);
  });

  it('skips for short messages', () => {
    expect(
      shouldUseLlmClassifier({
        deterministicProfile: 'lite',
        message: 'hi please look',
        attachmentCount: 0,
      }),
    ).toBe(false);
  });

  it('triggers for long substantive prose', () => {
    expect(
      shouldUseLlmClassifier({
        deterministicProfile: 'lite',
        message: 'a'.repeat(700),
        attachmentCount: 0,
      }),
    ).toBe(true);
  });

  it('triggers when many bullet lines are present', () => {
    const msg =
      'we should consider:\n- auth\n- billing\n- migrations\n- mailers\n- analytics';
    expect(
      shouldUseLlmClassifier({
        deterministicProfile: 'lite',
        message: msg.padEnd(220, ' '),
        attachmentCount: 0,
      }),
    ).toBe(true);
  });
});

describe('router cache', () => {
  it('round-trips a value', () => {
    const key = makeRouterCacheKey({ message: 'Hello', attachmentCount: 0 });
    setRouterCache(key, { profile: 'lite', confidence: 0.9 });
    expect(getRouterCache(key)).toEqual({ profile: 'lite', confidence: 0.9 });
  });

  it('normalises whitespace and case in keys', () => {
    const a = makeRouterCacheKey({ message: 'Hello   World', attachmentCount: 1 });
    const b = makeRouterCacheKey({ message: 'hello world', attachmentCount: 1 });
    expect(a).toBe(b);
  });

  it('treats different attachment counts as different keys', () => {
    const a = makeRouterCacheKey({ message: 'same', attachmentCount: 0 });
    const b = makeRouterCacheKey({ message: 'same', attachmentCount: 1 });
    expect(a).not.toBe(b);
  });
});
