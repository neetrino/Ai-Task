'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { sendChatMessage } from '@/features/chat/chat-actions';
import {
  WORKSPACE_ACCENT_BTN_CLASS,
  WORKSPACE_FIELD_CLASS,
} from '@/shared/ui/workspace-ui';

function SendButton() {
  const { pending } = useFormStatus();
  return (
    <button className={`${WORKSPACE_ACCENT_BTN_CLASS} shrink-0 px-5`} disabled={pending} type="submit">
      {pending ? '…' : 'Send'}
    </button>
  );
}

export function ChatComposer({
  projectId,
  phaseId,
  activeModel,
}: {
  projectId: string;
  phaseId: string | null;
  activeModel: string;
}) {
  const [state, formAction] = useActionState(
    sendChatMessage.bind(null, projectId, phaseId),
    undefined,
  );

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <label className="sr-only" htmlFor="project-chat-message">
          Message
        </label>
        <textarea
          className={`min-h-[52px] flex-1 resize-none ${WORKSPACE_FIELD_CLASS}`}
          id="project-chat-message"
          name="message"
          placeholder="Message…"
          required
          rows={2}
        />
        <SendButton />
      </div>
      <details className="group text-xs text-slate-500">
        <summary className="cursor-pointer select-none text-violet-300/80 hover:text-violet-200">
          Optional context · model {activeModel}
        </summary>
        <label className="sr-only" htmlFor="pastedContext">
          Optional pasted text
        </label>
        <textarea
          className={`mt-2 min-h-[64px] text-sm ${WORKSPACE_FIELD_CLASS}`}
          id="pastedContext"
          name="pastedContext"
          placeholder="Paste specs or notes (optional)"
          rows={3}
        />
      </details>
      {state?.error ? <p className="text-sm text-red-400">{state.error}</p> : null}
    </form>
  );
}
