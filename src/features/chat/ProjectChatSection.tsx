'use client';

import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  ATTACHMENT_ACCEPT_ATTRIBUTE,
  ATTACHMENT_MAX_PER_MESSAGE,
} from '@/features/attachments/attachment-rules';
import { AttachmentChip } from '@/features/chat/AttachmentChip';
import {
  type AttachmentDraft,
  deleteAttachment,
  precheckFile,
  uploadAttachment,
} from '@/features/chat/attachment-uploads';
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

function makeLocalId(): string {
  return `local-${crypto.randomUUID()}`;
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
  attachmentIds: string[];
  router: { refresh: () => void };
}): Promise<void> {
  const { url, signal, message, phaseId, attachmentIds, router } = params;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, phaseId, attachmentIds }),
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  /** Per-attachment AbortControllers so removal can cancel an in-flight upload. */
  const uploadAbortRefs = useRef<Map<string, AbortController>>(new Map());

  const [attachments, setAttachments] = useState<AttachmentDraft[]>([]);
  const [dragDepth, setDragDepth] = useState(0);
  const isDragging = dragDepth > 0;

  const removeAttachment = useCallback(
    (localId: string) => {
      const controller = uploadAbortRefs.current.get(localId);
      if (controller) {
        controller.abort();
        uploadAbortRefs.current.delete(localId);
      }
      setAttachments((prev) => {
        const target = prev.find((a) => a.localId === localId);
        if (target?.serverId) {
          void deleteAttachment({
            projectSlug,
            attachmentId: target.serverId,
          }).catch((err) => {
            const msg = err instanceof Error ? err.message : 'Delete failed';
            toast.error(msg);
          });
        }
        return prev.filter((a) => a.localId !== localId);
      });
    },
    [projectSlug],
  );

  const startUpload = useCallback(
    (file: File) => {
      const check = precheckFile(file);
      if (!check.ok) {
        toast.error(`${file.name}: ${check.error}`);
        return;
      }
      const localId = makeLocalId();
      const draftItem: AttachmentDraft = {
        localId,
        filename: file.name,
        format: check.format,
        sizeBytes: file.size,
        status: 'uploading',
      };
      setAttachments((prev) => [...prev, draftItem]);

      const controller = new AbortController();
      uploadAbortRefs.current.set(localId, controller);

      uploadAttachment({ projectSlug, file, phaseId, signal: controller.signal })
        .then((res) => {
          setAttachments((prev) =>
            prev.map((a) =>
              a.localId === localId ? { ...a, status: 'ready', serverId: res.id } : a,
            ),
          );
        })
        .catch((err) => {
          if (err instanceof Error && err.name === 'AbortError') {
            return;
          }
          const message = err instanceof Error ? err.message : 'Upload failed';
          setAttachments((prev) =>
            prev.map((a) =>
              a.localId === localId ? { ...a, status: 'error', error: message } : a,
            ),
          );
          toast.error(`${file.name}: ${message}`);
        })
        .finally(() => {
          uploadAbortRefs.current.delete(localId);
        });
    },
    [phaseId, projectSlug],
  );

  const enqueueFiles = useCallback(
    (files: FileList | File[]) => {
      const list = Array.from(files);
      if (list.length === 0) return;
      const remaining = ATTACHMENT_MAX_PER_MESSAGE - attachments.length;
      if (remaining <= 0) {
        toast.error(`Attachment limit reached (max ${ATTACHMENT_MAX_PER_MESSAGE} per message)`);
        return;
      }
      const accepted = list.slice(0, remaining);
      if (list.length > remaining) {
        toast.error(`Only first ${remaining} file(s) added; limit is ${ATTACHMENT_MAX_PER_MESSAGE}`);
      }
      for (const file of accepted) {
        startUpload(file);
      }
    },
    [attachments.length, startUpload],
  );

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      enqueueFiles(files);
    }
    event.target.value = '';
  };

  /** Increment-on-enter / decrement-on-leave avoids flicker over child elements. */
  const handleDragEnter = (event: React.DragEvent<HTMLFormElement>) => {
    if (!event.dataTransfer?.types.includes('Files')) return;
    event.preventDefault();
    setDragDepth((d) => d + 1);
  };

  const handleDragOver = (event: React.DragEvent<HTMLFormElement>) => {
    if (!event.dataTransfer?.types.includes('Files')) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  };

  const handleDragLeave = (event: React.DragEvent<HTMLFormElement>) => {
    if (!event.dataTransfer?.types.includes('Files')) return;
    event.preventDefault();
    setDragDepth((d) => Math.max(0, d - 1));
  };

  const handleDrop = (event: React.DragEvent<HTMLFormElement>) => {
    if (!event.dataTransfer?.files || event.dataTransfer.files.length === 0) return;
    event.preventDefault();
    setDragDepth(0);
    enqueueFiles(event.dataTransfer.files);
  };

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

  const hasUploadingAttachment = attachments.some((a) => a.status === 'uploading');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const message = draft.trim();
    if (!message || isSending) return;
    if (hasUploadingAttachment) {
      toast.error('Wait for attachments to finish uploading');
      return;
    }

    const readyAttachmentIds = attachments
      .filter((a) => a.status === 'ready' && a.serverId)
      .map((a) => a.serverId as string);

    const controller = new AbortController();
    abortRef.current = controller;
    setIsSending(true);
    setDraft('');
    const sentAttachments = [...attachments];
    setAttachments([]);
    setPendingUserLines([
      { id: makeLocalId(), role: 'user', content: message },
    ]);

    const url = `/api/projects/${encodeURIComponent(projectSlug)}/chat`;

    void postProjectChatRequest({
      url,
      signal: controller.signal,
      message,
      phaseId,
      attachmentIds: readyAttachmentIds,
      router,
    })
      .catch(() => {
        // Restore attachments so the user can retry without re-uploading.
        setAttachments(sentAttachments);
      })
      .finally(() => {
        setIsSending(false);
        abortRef.current = null;
      });
  };

  return (
    <form
      className="relative flex h-full min-h-0 flex-1 flex-col bg-workspace-canvas"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
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

      {isDragging ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center bg-violet-500/[0.08] backdrop-blur-[1px]"
        >
          <div className="rounded-2xl border border-dashed border-violet-400/60 bg-neutral-900/80 px-6 py-4 text-sm text-neutral-100 shadow-2xl">
            Drop files to attach (.md, .txt, .json, .yaml)
          </div>
        </div>
      ) : null}

      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-[#212121] via-[#212121]/90 to-transparent pb-2 pt-10"
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-center px-4 pb-5 pt-6">
        <div className={`pointer-events-auto w-full ${CHAT_CONTENT_MAX}`}>
          <div className="flex w-full min-w-0 flex-col gap-2 rounded-[1.75rem] bg-workspace-elevated px-2 py-3.5 shadow-[0_2px_6px_rgba(0,0,0,0.35),0_12px_28px_-12px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.04)]">
            {attachments.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 px-1.5 pt-1">
                {attachments.map((a) => (
                  <AttachmentChip
                    draft={a}
                    key={a.localId}
                    onRemove={() => removeAttachment(a.localId)}
                  />
                ))}
              </div>
            ) : null}
            <div className="flex w-full min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
              <input
                accept={ATTACHMENT_ACCEPT_ATTRIBUTE}
                aria-hidden
                className="hidden"
                multiple
                onChange={handleFileInputChange}
                ref={fileInputRef}
                tabIndex={-1}
                type="file"
              />
              <button
                aria-label="Attach files"
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-neutral-300 transition hover:text-white ${isComposerMultiline ? 'mr-auto' : ''}`}
                onClick={() => fileInputRef.current?.click()}
                title="Attach .md, .txt, .json, .yaml"
                type="button"
              >
                <svg aria-hidden className="h-[22px] w-[22px]" fill="none" viewBox="0 0 24 24">
                  <path
                    d="M12 5v14m-7-7h14"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  />
                </svg>
              </button>
              <label className="sr-only" htmlFor="project-chat-message">
                Message
              </label>
              <textarea
                className={`scrollbar-chat-composer-hidden box-border min-w-0 resize-none bg-transparent px-1 pb-1 pt-2 text-[15px] leading-snug text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:ring-0 ${isComposerMultiline ? 'order-first w-full basis-full' : 'w-full flex-1'}`}
                id="project-chat-message"
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (!isSending && !hasUploadingAttachment) {
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
                className="hidden min-w-0 shrink truncate text-right text-[11px] text-neutral-500 sm:inline"
                title={activeModel}
              >
                {formatModelLabel(activeModel)}
              </span>
              <div className="shrink-0">
                <SendOrStopControl onStop={handleStop} pending={isSending} />
              </div>
            </div>
          </div>
          <p className="mt-2 text-center text-[11px] leading-tight text-neutral-500">
            Aibonacci is AI and can make mistakes. Please double-check responses.
          </p>
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
