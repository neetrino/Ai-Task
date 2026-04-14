'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { sendChatMessage } from '@/features/chat/chat-actions';

function SubmitChat() {
  const { pending } = useFormStatus();
  return (
    <button
      className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
      disabled={pending}
      type="submit"
    >
      {pending ? 'Sending…' : 'Send'}
    </button>
  );
}

export function ChatPanel({
  projectId,
  phaseId,
  activeModel,
}: {
  projectId: string;
  phaseId: string | null;
  /** Effective model id used for API calls (env or project override). */
  activeModel: string;
}) {
  const [state, formAction] = useFormState(
    sendChatMessage.bind(null, projectId, phaseId),
    undefined,
  );
  return (
    <form action={formAction} className="flex flex-col gap-3">
      <p className="text-xs text-slate-500">
        Model: <span className="font-mono text-slate-700">{activeModel}</span>
      </p>
      <label className="text-sm font-medium text-slate-700" htmlFor="message">
        Message
      </label>
      <textarea
        className="min-h-[96px] rounded-md border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
        id="message"
        name="message"
        placeholder="Describe goals, constraints, or edits to the plan…"
        required
      />
      <label className="text-sm font-medium text-slate-700" htmlFor="pastedContext">
        Optional: paste file or spec text
      </label>
      <textarea
        className="min-h-[72px] rounded-md border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
        id="pastedContext"
        name="pastedContext"
        placeholder="Paste supporting text (size limits apply at deployment)"
      />
      {state?.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      <div className="flex justify-end">
        <SubmitChat />
      </div>
    </form>
  );
}
