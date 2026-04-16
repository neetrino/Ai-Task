'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  AssistantPendingRow,
  SendOrStopControl,
} from '@/features/chat/ProjectChatComposerControls';
import { SiteLogoImage } from '@/shared/ui/site-logo';

export type ChatMessageLine = {
  id: string;
  role: string;
  content: string;
};

const CHAT_CONTENT_MAX = 'max-w-3xl';

/** Empty state — logo mark above the composer (Claude-style). */
const EMPTY_CHAT_LOGO_HEIGHT_PX = 80;

/** Single-line row height; matches min-h + vertical padding in the composer. */
const CHAT_INPUT_MIN_HEIGHT_PX = 44;
/** Cap growth so the docked composer does not cover the whole viewport. */
const CHAT_INPUT_MAX_HEIGHT_PX = 400;
/** Covers subpixel / line-height rounding so 2 lines do not falsely show a scrollbar. */
const CHAT_INPUT_SCROLL_HEIGHT_BUFFER_PX = 4;

function formatModelLabel(id: string): string {
  if (id.length <= 28) return id;
  return `${id.slice(0, 14)}…${id.slice(-10)}`;
}

type ProjectChatSectionProps = {
  initialMessages: ChatMessageLine[];
  projectSlug: string;
  phaseId: string | null;
  activeModel: string;
};

type ChatPostResponseJson = {
  error?: string;
  cancelled?: boolean;
  ok?: boolean;
};

async function postProjectChatRequest(params: {
  url: string;
  signal: AbortSignal;
  message: string;
  phaseId: string | null;
  router: { refresh: () => void };
}): Promise<void> {
  const { url, signal, message, phaseId, router } = params;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, phaseId }),
      signal,
    });

    const data = (await res.json()) as ChatPostResponseJson;

    if (!res.ok) {
      toast.error(data.error ?? 'Request failed');
      router.refresh();
      return;
    }
    if (data.error) {
      toast.error(data.error);
      router.refresh();
      return;
    }
    router.refresh();
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      router.refresh();
      return;
    }
    toast.error('Network error');
    router.refresh();
  }
}

export function ProjectChatSection({
  initialMessages,
  projectSlug,
  phaseId,
  activeModel,
}: ProjectChatSectionProps) {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  /** Local user bubble(s) shown immediately; cleared when server props catch up. */
  const [pendingUserLines, setPendingUserLines] = useState<ChatMessageLine[]>([]);

  const messagesVersion = useMemo(
    () =>
      `${phaseId ?? 'none'}:${initialMessages.length}:${initialMessages.at(-1)?.id ?? 'none'}`,
    [phaseId, initialMessages],
  );

  useLayoutEffect(() => {
    setPendingUserLines([]);
  }, [messagesVersion]);

  const displayMessages = useMemo(
    () => [...initialMessages, ...pendingUserLines],
    [initialMessages, pendingUserLines],
  );

  const [isSending, setIsSending] = useState(false);
  const [draft, setDraft] = useState('');
  const messageTextareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [displayMessages, isSending]);

  useLayoutEffect(() => {
    const el = messageTextareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const intrinsic = el.scrollHeight;
    const nextHeight = Math.min(
      Math.max(intrinsic + CHAT_INPUT_SCROLL_HEIGHT_BUFFER_PX, CHAT_INPUT_MIN_HEIGHT_PX),
      CHAT_INPUT_MAX_HEIGHT_PX,
    );
    el.style.height = `${nextHeight}px`;
    el.style.overflowY = el.scrollHeight > el.clientHeight ? 'auto' : 'hidden';
  }, [draft]);

  const handleStop = () => {
    abortRef.current?.abort();
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const message = draft.trim();
    if (!message || isSending) return;

    const controller = new AbortController();
    abortRef.current = controller;
    setIsSending(true);
    setDraft('');
    setPendingUserLines([
      { id: `local-${crypto.randomUUID()}`, role: 'user', content: message },
    ]);

    const url = `/api/projects/${encodeURIComponent(projectSlug)}/chat`;

    void postProjectChatRequest({
      url,
      signal: controller.signal,
      message,
      phaseId,
      router,
    }).finally(() => {
      setIsSending(false);
      abortRef.current = null;
    });
  };

  return (
    <form
      className="relative flex h-full min-h-0 flex-1 flex-col bg-workspace-canvas"
      onSubmit={handleSubmit}
    >
      <div
        className="scrollbar-workspace-subtle flex min-h-0 flex-1 flex-col overflow-y-auto"
        ref={scrollRef}
      >
        {displayMessages.length === 0 ? (
          <div
            className={`mx-auto flex w-full flex-1 flex-col items-center justify-center px-5 pb-44 pt-6 ${CHAT_CONTENT_MAX}`}
          >
            <SiteLogoImage
              className="h-20 w-auto opacity-95"
              heightPx={EMPTY_CHAT_LOGO_HEIGHT_PX}
            />
          </div>
        ) : (
          <div className={`mx-auto w-full ${CHAT_CONTENT_MAX} px-5 pb-44 pt-4`}>
            <div className="space-y-10">
              {displayMessages.map((m) =>
                m.role === 'user' ? (
                  <div className="flex justify-end" key={m.id}>
                    <div className="max-w-[min(100%,85%)] rounded-3xl bg-neutral-700 px-4 py-3 text-sm leading-relaxed text-neutral-100">
                      <span className="whitespace-pre-wrap">{m.content}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm leading-relaxed text-neutral-300" key={m.id}>
                    <span className="mb-2 block text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
                      Assistant
                    </span>
                    <span className="whitespace-pre-wrap">{m.content}</span>
                  </div>
                ),
              )}
              <AssistantPendingRow pending={isSending} />
            </div>
          </div>
        )}
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-[#212121] via-[#212121]/90 to-transparent pb-2 pt-10"
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-center px-4 pb-5 pt-6">
        <div className={`pointer-events-auto w-full ${CHAT_CONTENT_MAX}`}>
          <div className="flex w-full flex-col">
            <div className="flex w-full min-w-0 flex-col rounded-[1.75rem] border border-white/[0.1] bg-workspace-elevated px-3 pb-2 pt-3 shadow-none">
              <label className="sr-only" htmlFor="project-chat-message">
                Message
              </label>
              <textarea
                className="scrollbar-chat-composer-hidden box-border min-h-[44px] w-full min-w-0 resize-none bg-transparent px-0.5 py-0 text-[15px] leading-snug text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:ring-0"
                id="project-chat-message"
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (!isSending) {
                      e.currentTarget.form?.requestSubmit();
                    }
                  }
                }}
                placeholder="Describe your goal or paste specs…"
                ref={messageTextareaRef}
                rows={1}
                style={{
                  maxHeight: CHAT_INPUT_MAX_HEIGHT_PX,
                  minHeight: CHAT_INPUT_MIN_HEIGHT_PX,
                }}
                value={draft}
              />
              <div className="mt-2 flex min-h-[40px] w-full min-w-0 shrink-0 items-center gap-3 pt-0.5">
                <button
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg leading-none text-neutral-500 transition hover:bg-white/[0.06] hover:text-neutral-300"
                  disabled
                  title="Attachments (coming soon)"
                  type="button"
                >
                  +
                </button>
                <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
                  <span
                    className="min-w-0 truncate text-right text-[10px] text-neutral-500 sm:text-[11px]"
                    title={activeModel}
                  >
                    {formatModelLabel(activeModel)}
                  </span>
                  <div className="shrink-0">
                    <SendOrStopControl onStop={handleStop} pending={isSending} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
