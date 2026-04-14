'use client';

import { useMemo, useState, useTransition } from 'react';
import type { PlanPayload } from '@/shared/domain/plan';
import { savePlanSnapshot } from '@/features/plan-editor/plan-actions';
import {
  WORKSPACE_BODY_CLASS,
  WORKSPACE_FIELD_CLASS,
  WORKSPACE_GHOST_BTN_CLASS,
  WORKSPACE_H2_CLASS,
} from '@/shared/ui/workspace-ui';

export function PlanEditor({
  projectId,
  phaseId,
  initialPlan,
  embedded = false,
}: {
  projectId: string;
  phaseId: string | null;
  initialPlan: PlanPayload;
  /** Hides large heading; use inside settings panels. */
  embedded?: boolean;
}) {
  const [json, setJson] = useState(() => JSON.stringify(initialPlan, null, 2));
  const [note, setNote] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const validPreview = useMemo(() => {
    try {
      return JSON.parse(json) as unknown;
    } catch {
      return null;
    }
  }, [json]);

  function onSave() {
    setNote(null);
    start(async () => {
      const res = await savePlanSnapshot(projectId, phaseId, json);
      if (res && 'error' in res && res.error) {
        setNote(res.error);
        return;
      }
      setNote('Saved.');
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        className={`flex items-center gap-3 ${embedded ? 'justify-end' : 'justify-between'}`}
      >
        {embedded ? null : <h2 className={WORKSPACE_H2_CLASS}>Plan</h2>}
        <button className={WORKSPACE_GHOST_BTN_CLASS} disabled={pending} onClick={onSave} type="button">
          {pending ? 'Saving…' : 'Save plan'}
        </button>
      </div>
      {embedded ? null : (
        <p className={WORKSPACE_BODY_CLASS}>
          Edit the structured JSON (validated on save). AI chat updates this automatically.
        </p>
      )}
      <textarea
        className={`min-h-[220px] w-full font-mono ${WORKSPACE_FIELD_CLASS}`}
        onChange={(e) => setJson(e.target.value)}
        spellCheck={false}
        value={json}
      />
      {note ? <p className="text-sm text-slate-300">{note}</p> : null}
      {validPreview ? (
        <p className="text-xs text-slate-500">JSON parses locally. Server validates schema on save.</p>
      ) : (
        <p className="text-xs text-red-400">Invalid JSON — fix before saving.</p>
      )}
    </div>
  );
}
