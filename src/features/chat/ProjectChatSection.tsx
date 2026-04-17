'use client';

import { memo, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
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

/**
 * Single-line textarea height — matches the action buttons (h-9 = 36px) so the
 * composer reads as one thin pill row when the draft fits on a single line.
 */
const CHAT_INPUT_MIN_HEIGHT_PX = 36;
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

function ProjectChatSectionImpl({
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
  /**
   * True once the textarea has wrapped past its single-line height. Drives the
   * ChatGPT-style layout switch where controls move to their own row below the
   * textarea so the text can use the full pill width.
   */
  const [isComposerMultiline, setIsComposerMultiline] = useState(false);
  const messageTextareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [displayMessages, isSending]);

  useEffect(() => {
    const el = messageTextareaRef.current;
    if (!el) return;
    // Defer the costly layout read (`scrollHeight`) to the next animation
    // frame so long drafts don't stall keystroke handling. `useLayoutEffect`
    // would force a synchronous measure on every keypress.
    const raf = requestAnimationFrame(() => {
      el.style.height = 'auto';
      const intrinsic = el.scrollHeight;
      const nextHeight = Math.min(
        Math.max(intrinsic + CHAT_INPUT_SCROLL_HEIGHT_BUFFER_PX, CHAT_INPUT_MIN_HEIGHT_PX),
        CHAT_INPUT_MAX_HEIGHT_PX,
      );
      el.style.height = `${nextHeight}px`;
      el.style.overflowY = el.scrollHeight > el.clientHeight ? 'auto' : 'hidden';
      setIsComposerMultiline(nextHeight > CHAT_INPUT_MIN_HEIGHT_PX + CHAT_INPUT_SCROLL_HEIGHT_BUFFER_PX);
    });
    return () => cancelAnimationFrame(raf);
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
            className={`mx-auto flex w-full flex-1 flex-col items-center justify-center px-5 pb-44 pt-2 ${CHAT_CONTENT_MAX}`}
          >
            <SiteLogoImage
              className="h-20 w-auto opacity-95"
              heightPx={EMPTY_CHAT_LOGO_HEIGHT_PX}
            />
          </div>
        ) : (
          <div className={`mx-auto w-full ${CHAT_CONTENT_MAX} px-5 pb-44 pt-2`}>
            <div className="space-y-10">
              {displayMessages.map((m) =>
                m.role === 'user' ? (
                  <div className="flex justify-end" key={m.id}>
                    <div className="max-w-[min(100%,85%)] rounded-3xl bg-[#323232] px-5 py-2.5 text-[15px] leading-relaxed text-neutral-50">
                      <span className="whitespace-pre-wrap">{m.content}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-[15px] leading-relaxed text-neutral-50" key={m.id}>
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
          <div className="flex w-full min-w-0 flex-wrap items-end gap-x-2 gap-y-1 rounded-[1.75rem] bg-workspace-elevated px-2 py-1.5 shadow-[0_2px_6px_rgba(0,0,0,0.35),0_12px_28px_-12px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.04)]">
            <button
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg leading-none text-neutral-500 transition hover:bg-white/[0.06] hover:text-neutral-300 ${isComposerMultiline ? 'mr-auto' : ''}`}
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
              className={`scrollbar-chat-composer-hidden box-border min-w-0 resize-none bg-transparent px-1 py-1.5 text-[15px] leading-snug text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:ring-0 ${isComposerMultiline ? 'order-first w-full basis-full' : 'w-full flex-1'}`}
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
            <span
              className="mb-2 hidden min-w-0 shrink truncate text-right text-[11px] text-neutral-500 sm:inline"
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
    </form>
  );
}

/**
 * Memoized export so unrelated state changes in the host component
 * (tasks panel, modal, plan editing) don't force the chat tree to re-render.
 */
export const ProjectChatSection = memo(ProjectChatSectionImpl);
