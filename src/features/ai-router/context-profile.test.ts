import { describe, expect, it } from 'vitest';
import { detectContextProfile, stripPlanCommand } from '@/features/ai-router/context-profile';

describe('detectContextProfile', () => {
  it('returns lite for a short greeting without files', () => {
    const d = detectContextProfile({
      message: 'hi there',
      attachmentCount: 0,
      explicitPlanIntent: false,
    });
    expect(d.profile).toBe('lite');
    expect(d.reason).toBe('default-lite');
  });

  it('returns doc when attachments are present', () => {
    const d = detectContextProfile({
      message: 'what is this file about?',
      attachmentCount: 1,
      explicitPlanIntent: false,
    });
    expect(d.profile).toBe('doc');
    expect(d.reason).toBe('has-attachments');
  });

  it('returns plan when the user types /plan', () => {
    const d = detectContextProfile({
      message: 'add caching layer /plan',
      attachmentCount: 0,
      explicitPlanIntent: false,
    });
    expect(d.profile).toBe('plan');
    expect(d.reason).toBe('plan-command');
  });

  it('returns plan on Russian "обнови план"', () => {
    const d = detectContextProfile({
      message: 'обнови план: добавь auth',
      attachmentCount: 0,
      explicitPlanIntent: false,
    });
    expect(d.profile).toBe('plan');
    expect(d.reason).toBe('plan-keyword');
  });

  it('explicit plan intent wins over attachments', () => {
    const d = detectContextProfile({
      message: 'see the spec',
      attachmentCount: 2,
      explicitPlanIntent: true,
    });
    expect(d.profile).toBe('plan');
    expect(d.reason).toBe('explicit-plan');
  });
});

describe('stripPlanCommand', () => {
  it('removes /plan and trims whitespace', () => {
    expect(stripPlanCommand('/plan add tests')).toBe('add tests');
    expect(stripPlanCommand('add tests /plan')).toBe('add tests');
    expect(stripPlanCommand('add /plan tests')).toBe('add tests');
  });

  it('leaves messages without /plan unchanged', () => {
    expect(stripPlanCommand('hello world')).toBe('hello world');
  });
});
