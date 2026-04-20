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

  it('skips for very short messages even with a marker', () => {
    expect(
      shouldUseLlmClassifier({
        deterministicProfile: 'lite',
        message: 'sdelay',
        attachmentCount: 0,
      }),
    ).toBe(false);
  });

  it('triggers for short message with imperative marker (transliteration)', () => {
    expect(
      shouldUseLlmClassifier({
        deterministicProfile: 'lite',
        message: 'sdelay zadachi po proektu',
        attachmentCount: 0,
      }),
    ).toBe(true);
  });

  it('triggers for short message with English imperative marker', () => {
    expect(
      shouldUseLlmClassifier({
        deterministicProfile: 'lite',
        message: "let's plan the next sprint",
        attachmentCount: 0,
      }),
    ).toBe(true);
  });

  it('skips short small-talk without markers', () => {
    expect(
      shouldUseLlmClassifier({
        deterministicProfile: 'lite',
        message: 'kakaya pogoda segodnya',
        attachmentCount: 0,
      }),
    ).toBe(false);
  });

  it('triggers on longer message even without explicit marker', () => {
    expect(
      shouldUseLlmClassifier({
        deterministicProfile: 'lite',
        message:
          'we are thinking about the auth flow and how the new sessions might affect everything else later',
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
