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

  it('returns plan on Russian "сделай задачи"', () => {
    const d = detectContextProfile({
      message: 'сделай задачи по этому',
      attachmentCount: 0,
      explicitPlanIntent: false,
    });
    expect(d.profile).toBe('plan');
    expect(d.reason).toBe('plan-keyword');
  });

  it('returns plan on Russian "накидай план на неделю"', () => {
    const d = detectContextProfile({
      message: 'накидай план на неделю',
      attachmentCount: 0,
      explicitPlanIntent: false,
    });
    expect(d.profile).toBe('plan');
    expect(d.reason).toBe('plan-keyword');
  });

  it('returns plan on Russian Latin transliteration "sdelay zadachi"', () => {
    const d = detectContextProfile({
      message: 'sdelay zadachi po etomu',
      attachmentCount: 0,
      explicitPlanIntent: false,
    });
    expect(d.profile).toBe('plan');
    expect(d.reason).toBe('plan-keyword');
  });

  it('returns plan on Russian Latin "obnovi plan"', () => {
    const d = detectContextProfile({
      message: 'obnovi plan: dobav auth',
      attachmentCount: 0,
      explicitPlanIntent: false,
    });
    expect(d.profile).toBe('plan');
    expect(d.reason).toBe('plan-keyword');
  });

  it('returns plan on Armenian "սարքիր առաջադրանքներ"', () => {
    const d = detectContextProfile({
      message: 'սարքիր առաջադրանքներ auth-ի համար',
      attachmentCount: 0,
      explicitPlanIntent: false,
    });
    expect(d.profile).toBe('plan');
    expect(d.reason).toBe('plan-keyword');
  });

  it('returns plan on Armenian Latin "sarkir arajadrankner"', () => {
    const d = detectContextProfile({
      message: 'sarkir arajadrankner auth-i hamar',
      attachmentCount: 0,
      explicitPlanIntent: false,
    });
    expect(d.profile).toBe('plan');
    expect(d.reason).toBe('plan-keyword');
  });

  it('returns plan on English "let\'s draft a backlog"', () => {
    const d = detectContextProfile({
      message: "let's draft a backlog for the auth flow",
      attachmentCount: 0,
      explicitPlanIntent: false,
    });
    expect(d.profile).toBe('plan');
    expect(d.reason).toBe('plan-keyword');
  });

  it('returns plan on English "make tasks"', () => {
    const d = detectContextProfile({
      message: 'please make tasks for the migration',
      attachmentCount: 0,
      explicitPlanIntent: false,
    });
    expect(d.profile).toBe('plan');
    expect(d.reason).toBe('plan-keyword');
  });

  it('keeps lite for casual Russian "привет, как дела"', () => {
    const d = detectContextProfile({
      message: 'привет, как дела?',
      attachmentCount: 0,
      explicitPlanIntent: false,
    });
    expect(d.profile).toBe('lite');
    expect(d.reason).toBe('default-lite');
  });

  it('keeps lite for transliterated "spasibo"', () => {
    const d = detectContextProfile({
      message: 'spasibo, ponyal',
      attachmentCount: 0,
      explicitPlanIntent: false,
    });
    expect(d.profile).toBe('lite');
    expect(d.reason).toBe('default-lite');
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
