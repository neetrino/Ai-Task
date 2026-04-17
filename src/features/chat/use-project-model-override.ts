'use client';

/**
 * Per-conversation model override stored in localStorage by project id.
 *
 * Project settings define the "default preset" for the project; this hook
 * lets the user override it just for the current chat session without
 * touching the database. `null` means "use the project default".
 *
 * SSR-safe: state initialises to `null` and is hydrated from localStorage
 * inside an effect so the first render matches between server and client.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CHAT_MODELS,
  isModelPreset,
  type ModelPreset,
} from '@/shared/lib/ai-models';

const STORAGE_KEY_PREFIX = 'aibonacci:model:';

export type ModelOverride = {
  readonly preset: ModelPreset;
  readonly pinnedModelId: string | null;
};

export type ProjectModelDefault = {
  readonly preset: ModelPreset;
  readonly pinnedModelId: string | null;
};

export type ProjectModelOverrideHook = {
  /** Currently effective selection: override if set, otherwise project default. */
  readonly effective: ModelOverride;
  /** Raw override from localStorage (null = "follow project default"). */
  readonly override: ModelOverride | null;
  readonly setOverride: (next: ModelOverride) => void;
  readonly resetToProject: () => void;
};

function storageKey(projectId: string): string {
  return `${STORAGE_KEY_PREFIX}${projectId}`;
}

function knownPinnedId(id: string | null | undefined): string | null {
  if (!id) return null;
  return CHAT_MODELS.some((m) => m.id === id) ? id : null;
}

function parseStored(raw: string): ModelOverride | null {
  try {
    const value = JSON.parse(raw) as unknown;
    if (!value || typeof value !== 'object') return null;
    const v = value as { preset?: unknown; pinnedModelId?: unknown };
    if (typeof v.preset !== 'string' || !isModelPreset(v.preset)) return null;
    const pinned =
      typeof v.pinnedModelId === 'string' ? knownPinnedId(v.pinnedModelId) : null;
    return { preset: v.preset, pinnedModelId: pinned };
  } catch {
    return null;
  }
}

function readOverride(projectId: string): ModelOverride | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(storageKey(projectId));
    if (!raw) return null;
    return parseStored(raw);
  } catch {
    return null;
  }
}

function writeOverride(projectId: string, value: ModelOverride | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (value === null) {
      window.localStorage.removeItem(storageKey(projectId));
      return;
    }
    window.localStorage.setItem(storageKey(projectId), JSON.stringify(value));
  } catch {
    // Storage may be disabled (private mode, quota); silently ignore.
  }
}

export function useProjectModelOverride(
  projectId: string,
  projectDefault: ProjectModelDefault,
): ProjectModelOverrideHook {
  const [override, setOverrideState] = useState<ModelOverride | null>(null);

  useEffect(() => {
    setOverrideState(readOverride(projectId));
  }, [projectId]);

  const setOverride = useCallback(
    (next: ModelOverride) => {
      const sanitised: ModelOverride = {
        preset: next.preset,
        pinnedModelId:
          next.preset === 'PINNED' ? knownPinnedId(next.pinnedModelId) : null,
      };
      setOverrideState(sanitised);
      writeOverride(projectId, sanitised);
    },
    [projectId],
  );

  const resetToProject = useCallback(() => {
    setOverrideState(null);
    writeOverride(projectId, null);
  }, [projectId]);

  const effective = useMemo<ModelOverride>(() => {
    if (override) return override;
    return {
      preset: projectDefault.preset,
      pinnedModelId: knownPinnedId(projectDefault.pinnedModelId),
    };
  }, [override, projectDefault.preset, projectDefault.pinnedModelId]);

  return { effective, override, setOverride, resetToProject };
}
