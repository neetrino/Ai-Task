'use client';

/**
 * Pure presentational rows used by `ModelPresetPicker`.
 * Split from the popover wrapper so each file fits the 300-line budget.
 */

import {
  getDefaultModelForPreset,
  getModelById,
  getPresetAccentClasses,
  getPresetMeta,
  getTierColor,
  isReasoningTier,
  type PresetMeta,
} from '@/shared/lib/ai-models';
import type { ModelOverride } from './use-project-model-override';

function formatPrice(value: number): string {
  return `${value.toFixed(2)}$`;
}

function modelPriceLabel(modelId: string): string {
  const m = getModelById(modelId);
  if (!m) return '';
  return `${formatPrice(m.pricing.promptPer1M)}/${formatPrice(m.pricing.completionPer1M)} - 1M`;
}

export function ReasoningIcon() {
  return (
    <svg aria-hidden className="h-3 w-3" fill="none" viewBox="0 0 24 24">
      <path
        d="M9 3a4 4 0 00-4 4v1a3 3 0 00-1 5.83V16a4 4 0 004 4h2V3H9zm6 0h-2v17h2a4 4 0 004-4v-2.17A3 3 0 0019 8V7a4 4 0 00-4-4z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function ChevronDown({ rotated }: { rotated: boolean }) {
  return (
    <svg
      aria-hidden
      className={`h-3 w-3 text-neutral-500 transition ${rotated ? 'rotate-180' : ''}`}
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M6 9l6 6 6-6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function effectiveModelLabel(effective: ModelOverride): string | null {
  if (effective.preset === 'AUTO') return null;
  if (effective.preset === 'PINNED') {
    const m = effective.pinnedModelId ? getModelById(effective.pinnedModelId) : null;
    return m?.label ?? '—';
  }
  return getDefaultModelForPreset(effective.preset).label;
}

export function TriggerChip({
  effective,
  onClick,
  buttonRef,
  expanded,
  controlsId,
}: {
  effective: ModelOverride;
  onClick: () => void;
  buttonRef: React.RefObject<HTMLButtonElement | null>;
  expanded: boolean;
  controlsId: string;
}) {
  const meta = getPresetMeta(effective.preset);
  const accent = getPresetAccentClasses(meta.accent);
  const modelLabel = effectiveModelLabel(effective);

  return (
    <button
      aria-controls={controlsId}
      aria-expanded={expanded}
      aria-haspopup="dialog"
      className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-neutral-800/60 px-2 py-[3px] text-[11px] text-neutral-400 transition hover:border-white/15 hover:text-neutral-200"
      onClick={onClick}
      ref={buttonRef}
      title={meta.description}
      type="button"
    >
      <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${accent.dot}`} />
      <span className="font-medium text-neutral-200">{meta.shortLabel}</span>
      {modelLabel ? <span className="text-neutral-500">· {modelLabel}</span> : null}
      <ChevronDown rotated={expanded} />
    </button>
  );
}

export function PresetRow({
  preset,
  active,
  onSelect,
}: {
  preset: PresetMeta;
  active: boolean;
  onSelect: () => void;
}) {
  const accent = getPresetAccentClasses(preset.accent);
  const baseClass =
    'flex w-full items-start gap-2.5 rounded-lg border px-2.5 py-2 text-left text-xs transition';
  const activeClass = `${accent.activeBorder} ${accent.activeBg} text-neutral-100`;
  const idleClass =
    'border-transparent bg-transparent text-neutral-300 hover:bg-white/[0.04] hover:text-neutral-100';
  return (
    <button
      aria-pressed={active}
      className={`${baseClass} ${active ? activeClass : idleClass}`}
      onClick={onSelect}
      type="button"
    >
      <span aria-hidden className={`mt-1 h-2 w-2 shrink-0 rounded-full ${accent.dot}`} />
      <span className="flex flex-1 flex-col">
        <span
          className={`text-[13px] font-medium ${active ? accent.text : 'text-neutral-100'}`}
        >
          {preset.label}
        </span>
        <span className="mt-0.5 text-[11px] leading-snug text-neutral-400">
          {preset.description}
        </span>
      </span>
    </button>
  );
}

function ModelHoverHint({
  label,
  bestFor,
  contextWindow,
}: {
  label: string;
  bestFor: string;
  contextWindow: number;
}) {
  const ctx = `${Math.round(contextWindow / 1000)}k context`;
  return (
    <div className="invisible absolute bottom-0 left-full z-[60] pl-2 opacity-0 transition group-hover:visible group-hover:opacity-100">
      <div className="w-56 rounded-xl border border-white/[0.06] bg-neutral-900/95 p-3 shadow-[0_18px_40px_-12px_rgba(0,0,0,0.7)] backdrop-blur">
        <div className="text-[12px] font-medium text-neutral-100">{label}</div>
        <p className="mt-1.5 text-[11px] leading-snug text-neutral-300">{bestFor}</p>
        <p className="mt-2 text-[10.5px] uppercase tracking-wide text-neutral-500">
          {ctx}
        </p>
      </div>
    </div>
  );
}

export function ModelRow({
  modelId,
  active,
  onSelect,
}: {
  modelId: string;
  active: boolean;
  onSelect: () => void;
}) {
  const m = getModelById(modelId);
  if (!m) return null;
  const tierColor = getTierColor(m.tier);
  const baseClass =
    'flex w-full items-center gap-2.5 rounded-md border-l-2 py-1.5 pl-2.5 pr-2 text-left text-xs transition';
  const activeClass = 'bg-white/[0.05] text-neutral-100';
  const idleClass =
    'bg-transparent text-neutral-300 hover:bg-white/[0.03] hover:text-neutral-100';
  return (
    <div className="group relative">
      <button
        aria-pressed={active}
        className={`${baseClass} ${tierColor.border} ${active ? activeClass : idleClass}`}
        onClick={onSelect}
        type="button"
      >
        <span className={`flex flex-1 items-center gap-1.5 font-medium ${tierColor.text}`}>
          {m.label}
          {isReasoningTier(m.tier) ? (
            <span
              className="text-amber-300/80"
              title="Reasoning model — slower, deeper analysis"
            >
              <ReasoningIcon />
            </span>
          ) : null}
        </span>
        <span className="text-[10.5px] tabular-nums text-neutral-500">
          {modelPriceLabel(m.id)}
        </span>
      </button>
      <ModelHoverHint
        bestFor={m.bestFor}
        contextWindow={m.capabilities.contextWindow}
        label={m.label}
      />
    </div>
  );
}
