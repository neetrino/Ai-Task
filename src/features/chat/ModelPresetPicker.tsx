'use client';

/**
 * In-composer popover that lets the user override the project's default
 * model preset for the current chat session. Replaces the read-only
 * `ModelBadge` chip.
 *
 * Layout:
 *   [TriggerChip] ->
 *     popover {
 *       4 preset rows (Auto / Economy / Balanced / Quality)
 *       "Model" toggle -> list of catalog models with prices
 *       "Reset to project default" link (only when overridden)
 *     }
 *
 * Pure UI; persistence is handled by `useProjectModelOverride`.
 */

import { useEffect, useId, useRef, useState } from 'react';
import {
  CHAT_MODELS,
  getPresetAccentClasses,
  getPresetMeta,
  MODEL_PRESETS,
  type ModelPreset,
  type PresetMeta,
} from '@/shared/lib/ai-models';
import { ModelRow, PresetRow, TriggerChip } from './ModelPresetPickerRows';
import type { ModelOverride } from './use-project-model-override';

type ModelPresetPickerProps = {
  readonly effective: ModelOverride;
  readonly hasOverride: boolean;
  readonly onChange: (next: ModelOverride) => void;
  readonly onReset: () => void;
};

const NON_PINNED_PRESETS: readonly PresetMeta[] = MODEL_PRESETS.filter(
  (p) => p.id !== 'PINNED',
);

const PINNED_PRESET: PresetMeta = getPresetMeta('PINNED');

function useDismissOnOutside(
  open: boolean,
  popoverRef: React.RefObject<HTMLElement | null>,
  triggerRef: React.RefObject<HTMLElement | null>,
  close: () => void,
): void {
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node;
      if (popoverRef.current?.contains(target)) return;
      if (triggerRef.current?.contains(target)) return;
      close();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close();
    }
    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open, popoverRef, triggerRef, close]);
}

function ModelSectionToggle({
  active,
  open,
  onToggle,
  controlsId,
}: {
  active: boolean;
  open: boolean;
  onToggle: () => void;
  controlsId: string;
}) {
  const dot = getPresetAccentClasses(PINNED_PRESET.accent).dot;
  return (
    <button
      aria-controls={controlsId}
      aria-expanded={open}
      aria-haspopup="menu"
      className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-[13px] font-medium transition ${
        active || open
          ? 'bg-white/[0.04] text-neutral-100'
          : 'text-neutral-200 hover:bg-white/[0.04]'
      }`}
      onClick={onToggle}
      type="button"
    >
      <span className="flex items-center gap-2">
        <span aria-hidden className={`h-2 w-2 rounded-full ${dot}`} />
        {PINNED_PRESET.label}
      </span>
      <svg
        aria-hidden
        className="h-3.5 w-3.5 text-neutral-500"
        fill="none"
        viewBox="0 0 24 24"
      >
        <path
          d="M9 6l6 6-6 6"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      </svg>
    </button>
  );
}

function ModelSideFlyout({
  controlsId,
  effective,
  onSelectPinnedModel,
}: {
  controlsId: string;
  effective: ModelOverride;
  onSelectPinnedModel: (modelId: string) => void;
}) {
  const pinnedActive = effective.preset === 'PINNED';
  return (
    <div
      className="absolute bottom-0 left-full z-50 pl-2"
      id={controlsId}
      role="menu"
    >
      <div className="w-64 rounded-2xl border border-white/[0.06] bg-neutral-900/95 p-2 shadow-[0_18px_40px_-12px_rgba(0,0,0,0.7)] backdrop-blur">
        <div className="flex flex-col gap-1">
          {CHAT_MODELS.map((m) => (
            <ModelRow
              active={pinnedActive && effective.pinnedModelId === m.id}
              key={m.id}
              modelId={m.id}
              onSelect={() => onSelectPinnedModel(m.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function PopoverBody({
  popoverRef,
  controlsId,
  effective,
  hasOverride,
  modelSectionOpen,
  onSelectPreset,
  onSelectPinnedModel,
  onToggleModelSection,
  onOpenModelSection,
  onCloseModelSection,
  onReset,
}: {
  popoverRef: React.RefObject<HTMLDivElement | null>;
  controlsId: string;
  effective: ModelOverride;
  hasOverride: boolean;
  modelSectionOpen: boolean;
  onSelectPreset: (preset: ModelPreset) => void;
  onSelectPinnedModel: (modelId: string) => void;
  onToggleModelSection: () => void;
  onOpenModelSection: () => void;
  onCloseModelSection: () => void;
  onReset: () => void;
}) {
  const pinnedActive = effective.preset === 'PINNED';
  return (
    <div
      className="absolute bottom-full right-0 z-40 mb-2 w-72 rounded-2xl border border-white/[0.06] bg-neutral-900/95 p-2 shadow-[0_18px_40px_-12px_rgba(0,0,0,0.7)] backdrop-blur"
      id={controlsId}
      ref={popoverRef}
      role="dialog"
    >
      <div className="flex flex-col gap-1">
        {NON_PINNED_PRESETS.map((p) => (
          <PresetRow
            active={effective.preset === p.id}
            key={p.id}
            onSelect={() => onSelectPreset(p.id)}
            preset={p}
          />
        ))}
      </div>

      <div
        className="relative mt-1 border-t border-white/[0.05] pt-1"
        onMouseEnter={onOpenModelSection}
        onMouseLeave={onCloseModelSection}
      >
        <ModelSectionToggle
          active={pinnedActive}
          controlsId={`${controlsId}-models`}
          onToggle={onToggleModelSection}
          open={modelSectionOpen}
        />
        {modelSectionOpen ? (
          <ModelSideFlyout
            controlsId={`${controlsId}-models`}
            effective={effective}
            onSelectPinnedModel={onSelectPinnedModel}
          />
        ) : null}
      </div>

      {hasOverride ? (
        <div className="mt-1 border-t border-white/[0.05] pt-1">
          <button
            className="w-full rounded-lg px-2.5 py-1.5 text-left text-[11px] text-neutral-400 transition hover:bg-white/[0.04] hover:text-neutral-200"
            onClick={onReset}
            type="button"
          >
            Reset to project default
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function ModelPresetPicker({
  effective,
  hasOverride,
  onChange,
  onReset,
}: ModelPresetPickerProps) {
  const [open, setOpen] = useState(false);
  const [modelSectionOpen, setModelSectionOpen] = useState(
    effective.preset === 'PINNED',
  );
  const popoverRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const controlsId = useId();

  useDismissOnOutside(open, popoverRef, triggerRef, () => {
    setOpen(false);
    triggerRef.current?.focus();
  });

  const selectPreset = (preset: ModelPreset) => {
    onChange({ preset, pinnedModelId: null });
    if (preset !== 'PINNED') setModelSectionOpen(false);
  };

  const selectPinnedModel = (modelId: string) => {
    onChange({ preset: 'PINNED', pinnedModelId: modelId });
    setModelSectionOpen(true);
  };

  return (
    <div className="relative inline-block">
      <TriggerChip
        buttonRef={triggerRef}
        controlsId={controlsId}
        effective={effective}
        expanded={open}
        onClick={() => setOpen((v) => !v)}
      />
      {open ? (
        <PopoverBody
          controlsId={controlsId}
          effective={effective}
          hasOverride={hasOverride}
          modelSectionOpen={modelSectionOpen}
          onCloseModelSection={() => setModelSectionOpen(false)}
          onOpenModelSection={() => setModelSectionOpen(true)}
          onReset={onReset}
          onSelectPinnedModel={selectPinnedModel}
          onSelectPreset={selectPreset}
          onToggleModelSection={() => setModelSectionOpen((v) => !v)}
          popoverRef={popoverRef}
        />
      ) : null}
    </div>
  );
}
