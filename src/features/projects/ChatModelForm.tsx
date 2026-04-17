'use client';

import { useState } from 'react';
import { updateProjectModelPreset } from '@/features/projects/chat-model-actions';
import {
  CHAT_MODELS,
  getDefaultModelForPreset,
  getModelById,
  MODEL_PRESETS,
  type ModelPreset,
} from '@/shared/lib/ai-models';
import {
  WORKSPACE_ACCENT_BTN_CLASS,
  WORKSPACE_BODY_CLASS,
  WORKSPACE_FIELD_CLASS,
  WORKSPACE_LABEL_CLASS,
} from '@/shared/ui/workspace-ui';

type ProjectModelFields = {
  id: string;
  modelPreset: ModelPreset;
  pinnedModelId: string | null;
};

function describeResolvedModel(preset: ModelPreset, pinnedModelId: string | null): string {
  if (preset === 'PINNED') {
    const m = pinnedModelId ? getModelById(pinnedModelId) : null;
    return m ? `Always uses ${m.label}.` : 'Pick a model below.';
  }
  if (preset === 'AUTO') {
    return 'Platform picks the right model per request based on your message.';
  }
  const m = getDefaultModelForPreset(preset);
  return `Default model: ${m.label}. The router may downgrade if you approach your monthly limit.`;
}

export function ChatModelForm({ project }: { project: ProjectModelFields }) {
  const [preset, setPreset] = useState<ModelPreset>(project.modelPreset);
  const [pinnedModelId, setPinnedModelId] = useState<string>(
    project.pinnedModelId ?? CHAT_MODELS[0].id,
  );

  return (
    <form
      action={updateProjectModelPreset.bind(null, project.id)}
      className="flex flex-col gap-3"
    >
      <p className={WORKSPACE_BODY_CLASS}>
        Choose how the platform picks an AI model for this project.
      </p>

      <fieldset className="flex flex-col gap-1.5">
        <legend className={WORKSPACE_LABEL_CLASS}>Preset</legend>
        <div className="grid gap-1.5 sm:grid-cols-2">
          {MODEL_PRESETS.map((p) => {
            const checked = preset === p.id;
            return (
              <label
                className={`flex cursor-pointer items-start gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                  checked
                    ? 'border-violet-500/50 bg-violet-500/5 text-neutral-100'
                    : 'border-white/[0.06] bg-neutral-900/40 text-neutral-300 hover:border-white/15'
                }`}
                key={p.id}
              >
                <input
                  checked={checked}
                  className="mt-1 accent-violet-500"
                  name="preset"
                  onChange={() => setPreset(p.id)}
                  type="radio"
                  value={p.id}
                />
                <span className="flex flex-col">
                  <span className="font-medium">{p.label}</span>
                  <span className={`mt-0.5 text-xs ${WORKSPACE_BODY_CLASS}`}>
                    {p.description}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {preset === 'PINNED' ? (
        <label className="flex flex-col gap-1.5">
          <span className={WORKSPACE_LABEL_CLASS}>Model</span>
          <select
            className={`max-w-xl ${WORKSPACE_FIELD_CLASS}`}
            name="pinnedModelId"
            onChange={(e) => setPinnedModelId(e.target.value)}
            value={pinnedModelId}
          >
            {CHAT_MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label} — {m.description}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <p className={`text-xs ${WORKSPACE_BODY_CLASS}`}>
        {describeResolvedModel(preset, pinnedModelId)}
      </p>

      <div className="flex justify-end">
        <button className={WORKSPACE_ACCENT_BTN_CLASS} type="submit">
          Save preset
        </button>
      </div>
    </form>
  );
}
