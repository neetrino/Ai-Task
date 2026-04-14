'use client';

import { useActionState, useEffect, useOptimistic, useRef, useState, useTransition } from 'react';
import type { ComponentProps } from 'react';
import { useRouter } from 'next/navigation';
import { sendChatMessage } from '@/features/chat/chat-actions';
import { PhasePills } from '@/features/phases/PhasePills';

export type ChatMessageLine = {
  id: string;
  role: string;
  content: string;
};

const CHAT_CONTENT_MAX = 'max-w-3xl';

function SendControl({ pending }: { pending: boolean }) {
  return (
    <button
      aria-label="Send message"
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-600 text-white transition hover:bg-violet-500 disabled:opacity-50"
      disabled={pending}
      type="submit"
    >
      {pending ? (
        <span className="text-xs">…</span>
      ) : (
        <svg aria-hidden className="h-5 w-5" fill="none" viewBox="0 0 24 24">
          <path
            d="M12 19V5m0 0l-7 7m7-7l7 7"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
        </svg>
      )}
    </button>
  );
}

function AssistantPendingRow({ pending }: { pending: boolean }) {
  if (!pending) return null;
  return (
    <div className="text-sm leading-relaxed text-slate-400">
      <span className="mb-2 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        Assistant
      </span>
      <span className="inline-flex items-center gap-2">
        <span
          aria-hidden
          className="inline-block h-2 w-2 animate-pulse rounded-full bg-violet-400"
        />
        Updating plan…
      </span>
    </div>
  );
}

function formatModelLabel(id: string): string {
  if (id.length <= 28) return id;
  return `${id.slice(0, 14)}…${id.slice(-10)}`;
}

type ProjectChatSectionProps = {
  initialMessages: ChatMessageLine[];
  projectId: string;
  projectSlug: string;
  phases: ComponentProps<typeof PhasePills>['phases'];
  phaseId: string | null;
  activeModel: string;
};

export function ProjectChatSection({
  initialMessages,
  projectId,
  projectSlug,
  phases,
  phaseId,
  activeModel,
}: ProjectChatSectionProps) {
  const router = useRouter();
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [optimisticMessages, addOptimistic] = useOptimistic(
    initialMessages,
    (state, newMessage: ChatMessageLine) => [...state, newMessage],
  );

  const wrappedAction = async (prev: unknown, formData: FormData) =>
    sendChatMessage(projectId, phaseId, prev, formData);

  const [state, formAction] = useActionState(wrappedAction, undefined);
  const [isPending, startTransition] = useTransition();

  const [draft, setDraft] = useState('');
  const [pastedDraft, setPastedDraft] = useState('');

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [optimisticMessages, state, isPending]);

  useEffect(() => {
    if (state?.error) {
      router.refresh();
    }
  }, [state?.error, router]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const message = draft.trim();
    if (!message) return;

    addOptimistic({
      id: `optimistic-${crypto.randomUUID()}`,
      role: 'user',
      content: message,
    });

    const fd = new FormData();
    fd.set('message', message);
    fd.set('pastedContext', pastedDraft.trim());
    setDraft('');
    setPastedDraft('');
    startTransition(() => {
      void formAction(fd);
    });
  };

  return (
    <form
      className="relative flex h-full min-h-0 flex-1 flex-col"
      onSubmit={handleSubmit}
    >
      <div className="shrink-0 border-b border-white/10 bg-slate-950/50 px-3 py-2 sm:px-4">
        <PhasePills
          activePhaseId={phaseId}
          phases={phases}
          projectId={projectId}
          projectSlug={projectSlug}
        />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto" ref={scrollRef}>
        <div className={`mx-auto w-full ${CHAT_CONTENT_MAX} px-4 pb-40 pt-4`}>
          {optimisticMessages.length === 0 ? (
            <p className="py-12 text-center text-sm text-slate-500">
              Describe your goal — the assistant will structure tasks and update the plan. You can paste
              specs under <span className="text-slate-400">Optional context</span> so the plan reflects
              your document.
            </p>
          ) : (
            <div className="space-y-10">
              {optimisticMessages.map((m) =>
                m.role === 'user' ? (
                  <div className="flex justify-end" key={m.id}>
                    <div className="max-w-[min(100%,85%)] rounded-2xl bg-violet-600/30 px-4 py-3 text-sm leading-relaxed text-slate-100">
                      <span className="whitespace-pre-wrap">{m.content}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm leading-relaxed text-slate-200" key={m.id}>
                    <span className="mb-2 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                      Assistant
                    </span>
                    <span className="whitespace-pre-wrap">{m.content}</span>
                  </div>
                ),
              )}
              <AssistantPendingRow pending={isPending} />
            </div>
          )}
          <div aria-hidden ref={bottomRef} />
        </div>
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-slate-950 from-50% via-slate-950/90 to-transparent pb-3 pt-16"
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-center px-4 pb-4 pt-8">
        <div className={`pointer-events-auto w-full ${CHAT_CONTENT_MAX}`}>
          <div className="flex w-full flex-col gap-2">
            <div className="flex w-full items-end gap-2 rounded-[1.75rem] border border-white/12 bg-slate-950/90 px-2 py-2 shadow-[0_12px_48px_-16px_rgba(0,0,0,0.75)] backdrop-blur-xl">
              <button
                className="mb-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg leading-none text-slate-500 transition hover:bg-white/10 hover:text-slate-300"
                disabled
                title="Attachments (coming soon)"
                type="button"
              >
                +
              </button>
              <label className="sr-only" htmlFor="project-chat-message">
                Message
              </label>
              <textarea
                className="max-h-40 min-h-[44px] flex-1 resize-none bg-transparent py-2.5 text-[15px] leading-snug text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-0"
                id="project-chat-message"
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    e.currentTarget.form?.requestSubmit();
                  }
                }}
                placeholder="Reply…"
                rows={1}
                value={draft}
              />
              <div className="mb-1 flex shrink-0 items-center gap-2 pl-1">
                <span
                  className="max-w-[6.5rem] truncate text-right text-[10px] text-slate-500 sm:max-w-[10rem] sm:text-[11px]"
                  title={activeModel}
                >
                  {formatModelLabel(activeModel)}
                </span>
                <SendControl pending={isPending} />
              </div>
            </div>

            <details className="group px-1 text-xs text-slate-500">
              <summary className="cursor-pointer select-none list-none text-violet-300/70 hover:text-violet-200 [&::-webkit-details-marker]:hidden">
                Optional context
              </summary>
              <label className="sr-only" htmlFor="pastedContext">
                Optional pasted text
              </label>
              <textarea
                className="mt-2 min-h-[64px] w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:border-violet-400/40 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                id="pastedContext"
                onChange={(e) => setPastedDraft(e.target.value)}
                placeholder="Paste specs, doc excerpts, or requirements (optional)"
                rows={3}
                value={pastedDraft}
              />
            </details>
            {state?.error ? <p className="px-1 text-sm text-red-400">{state.error}</p> : null}
          </div>
        </div>
      </div>
    </form>
  );
}
