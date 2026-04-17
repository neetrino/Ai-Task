/**
 * Model presets shown to the user. The user picks a preset (Auto / Economy /
 * Balanced / Quality) or pins a specific model id; the router resolves the
 * preset to a concrete model per turn.
 *
 * The `PINNED` enum value is kept on the database side; the UI surfaces it as
 * "Model" (advanced — pick a specific model from the catalog).
 */

import { type ChatModel, getDefaultModelForTier, type ModelTier } from './catalog';

export type ModelPreset = 'AUTO' | 'ECONOMY' | 'BALANCED' | 'QUALITY' | 'PINNED';

/**
 * Visual accent for each preset. Mapped by the picker UI; stored as a token
 * here so colour decisions stay alongside preset semantics.
 */
export type PresetAccent = 'sky' | 'emerald' | 'amber' | 'rose' | 'neutral';

export type PresetMeta = {
  readonly id: ModelPreset;
  readonly label: string;
  readonly shortLabel: string;
  readonly description: string;
  /** Default tier this preset resolves to (Auto is overridden by the router). */
  readonly defaultTier: ModelTier;
  readonly accent: PresetAccent;
};

export const MODEL_PRESETS: readonly PresetMeta[] = [
  {
    id: 'AUTO',
    label: 'Auto',
    shortLabel: 'Auto',
    description: 'Platform picks the right model for each request',
    defaultTier: 'mini',
    accent: 'sky',
  },
  {
    id: 'ECONOMY',
    label: 'Economy',
    shortLabel: 'Economy',
    description: 'Cheapest models — fast and minimal cost',
    defaultTier: 'nano',
    accent: 'emerald',
  },
  {
    id: 'BALANCED',
    label: 'Balanced',
    shortLabel: 'Balanced',
    description: 'Mid-tier quality at moderate cost',
    defaultTier: 'mini',
    accent: 'amber',
  },
  {
    id: 'QUALITY',
    label: 'Quality',
    shortLabel: 'Quality',
    description: 'Flagship models — best results, higher cost',
    defaultTier: 'standard',
    accent: 'rose',
  },
  {
    id: 'PINNED',
    label: 'Model',
    shortLabel: 'Model',
    description: 'Always use one specific model you chose',
    defaultTier: 'mini',
    accent: 'neutral',
  },
];

const PRESET_BY_ID: ReadonlyMap<ModelPreset, PresetMeta> = new Map(
  MODEL_PRESETS.map((p) => [p.id, p]),
);

export const DEFAULT_PRESET: ModelPreset = 'AUTO';

export function getPresetMeta(id: ModelPreset): PresetMeta {
  const meta = PRESET_BY_ID.get(id);
  if (!meta) {
    throw new Error(`Unknown preset "${id}"`);
  }
  return meta;
}

export function isModelPreset(value: string): value is ModelPreset {
  return PRESET_BY_ID.has(value as ModelPreset);
}

/**
 * Default model for a non-Auto preset, used when the router has no extra
 * signals (or Auto downgrades to a specific tier under budget pressure).
 */
export function getDefaultModelForPreset(preset: ModelPreset): ChatModel {
  return getDefaultModelForTier(getPresetMeta(preset).defaultTier);
}

export type PresetAccentClasses = {
  /** Filled dot used inside the trigger badge and list rows. */
  readonly dot: string;
  /** Background tint for the active option in the picker. */
  readonly activeBg: string;
  /** Border colour for the active option. */
  readonly activeBorder: string;
  /** Subtle text accent (used on the preset label when active). */
  readonly text: string;
};

const ACCENT_CLASSES: Readonly<Record<PresetAccent, PresetAccentClasses>> = {
  sky: {
    dot: 'bg-sky-400',
    activeBg: 'bg-sky-500/10',
    activeBorder: 'border-sky-500/40',
    text: 'text-sky-200',
  },
  emerald: {
    dot: 'bg-emerald-400',
    activeBg: 'bg-emerald-500/10',
    activeBorder: 'border-emerald-500/40',
    text: 'text-emerald-200',
  },
  amber: {
    dot: 'bg-amber-400',
    activeBg: 'bg-amber-500/10',
    activeBorder: 'border-amber-500/40',
    text: 'text-amber-200',
  },
  rose: {
    dot: 'bg-rose-400',
    activeBg: 'bg-rose-500/10',
    activeBorder: 'border-rose-500/40',
    text: 'text-rose-200',
  },
  neutral: {
    dot: 'bg-neutral-400',
    activeBg: 'bg-neutral-500/10',
    activeBorder: 'border-neutral-500/40',
    text: 'text-neutral-200',
  },
};

export function getPresetAccentClasses(accent: PresetAccent): PresetAccentClasses {
  return ACCENT_CLASSES[accent];
}
