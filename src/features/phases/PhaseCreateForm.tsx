'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { createPhase } from '@/features/phases/phase-actions';

function SubmitPhase() {
  const { pending } = useFormStatus();
  return (
    <button
      className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
      disabled={pending}
      type="submit"
    >
      {pending ? 'Adding…' : 'Add phase'}
    </button>
  );
}

export function PhaseCreateForm({ projectId }: { projectId: string }) {
  const [state, action] = useActionState(createPhase.bind(null, projectId), undefined);
  return (
    <form action={action} className="flex flex-wrap items-end gap-2">
      <label className="flex flex-col gap-1 text-sm font-medium text-slate-700" htmlFor="label">
        New phase
        <input
          className="rounded-md border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
          id="label"
          name="label"
          placeholder="Iteration"
          required
          type="text"
        />
      </label>
      <SubmitPhase />
      {state?.error ? <p className="w-full text-sm text-red-600">{state.error}</p> : null}
    </form>
  );
}
