import { describe, expect, it } from 'vitest';
import { pickModelAndProfile, type RouterInput } from '@/features/ai-router/router';

const baseInput: RouterInput = {
  preset: 'AUTO',
  pinnedModelId: null,
  profileDecision: { profile: 'lite', reason: 'default-lite' },
  messageLength: 12,
  attachmentCount: 0,
  budgetPressure: 'none',
};

describe('pickModelAndProfile', () => {
  it('AUTO + lite → nano tier', () => {
    const d = pickModelAndProfile(baseInput);
    expect(d.model.tier).toBe('nano');
    expect(d.reason).toBe('auto-lite');
  });

  it('AUTO + plan → standard tier', () => {
    const d = pickModelAndProfile({
      ...baseInput,
      profileDecision: { profile: 'plan', reason: 'plan-keyword' },
    });
    expect(d.model.tier).toBe('standard');
    expect(d.reason).toBe('auto-plan');
  });

  it('AUTO + doc → mini tier', () => {
    const d = pickModelAndProfile({
      ...baseInput,
      profileDecision: { profile: 'doc', reason: 'has-attachments' },
      attachmentCount: 1,
    });
    expect(d.model.tier).toBe('mini');
    expect(d.reason).toBe('auto-doc');
  });

  it('ECONOMY always nano', () => {
    const d = pickModelAndProfile({
      ...baseInput,
      preset: 'ECONOMY',
      profileDecision: { profile: 'plan', reason: 'plan-keyword' },
    });
    expect(d.model.tier).toBe('nano');
    expect(d.reason).toBe('preset-economy');
  });

  it('QUALITY + plan → standard', () => {
    const d = pickModelAndProfile({
      ...baseInput,
      preset: 'QUALITY',
      profileDecision: { profile: 'plan', reason: 'plan-keyword' },
    });
    expect(d.model.tier).toBe('standard');
    expect(d.reason).toBe('preset-quality');
  });

  it('QUALITY + lite → mini (no waste on chit-chat)', () => {
    const d = pickModelAndProfile({ ...baseInput, preset: 'QUALITY' });
    expect(d.model.tier).toBe('mini');
  });

  it('PINNED with known id returns that exact model', () => {
    const d = pickModelAndProfile({
      ...baseInput,
      preset: 'PINNED',
      pinnedModelId: 'gpt-5-mini',
      profileDecision: { profile: 'plan', reason: 'plan-keyword' },
    });
    expect(d.model.id).toBe('gpt-5-mini');
    expect(d.reason).toBe('pinned');
  });

  it('PINNED with unknown id falls back to AUTO behaviour', () => {
    const d = pickModelAndProfile({
      ...baseInput,
      preset: 'PINNED',
      pinnedModelId: 'made-up-model',
      profileDecision: { profile: 'plan', reason: 'plan-keyword' },
    });
    expect(d.model.tier).toBe('standard');
    expect(d.reason).toBe('auto-plan');
  });

  it('soft-warn budget downgrades one tier', () => {
    const d = pickModelAndProfile({
      ...baseInput,
      preset: 'BALANCED',
      budgetPressure: 'soft-warn',
    });
    // BALANCED defaults to mini; downgrade goes to nano.
    expect(d.model.tier).toBe('nano');
    expect(d.reason).toBe('budget-downgrade');
  });

  it('soft-warn at nano tier stays at nano (cannot downgrade further)', () => {
    const d = pickModelAndProfile({
      ...baseInput,
      preset: 'ECONOMY',
      budgetPressure: 'soft-warn',
    });
    expect(d.model.tier).toBe('nano');
  });
});
