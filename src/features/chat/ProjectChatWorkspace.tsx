'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { WORKSPACE_PANEL_CLASS } from '@/shared/ui/workspace-ui';

export type ChatMessageLine = {
  id: string;
  role: string;
  content: string;
};

type ProjectChatWorkspaceProps = {
  messages: ChatMessageLine[];
  composer: ReactNode;
};

export function ProjectChatWorkspace({ messages, composer }: ProjectChatWorkspaceProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  return (
    <div className={`flex h-full min-h-[280px] flex-col ${WORKSPACE_PANEL_CLASS}`}>
      <div
        className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4"
        ref={scrollRef}
      >
        {messages.length === 0 ? (
          <p className="text-center text-sm text-slate-500">
            Describe your goal — the assistant will structure tasks and update the plan.
          </p>
        ) : (
          messages.map((m) => (
            <div
              className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              key={m.id}
            >
              <div
                className={`flex max-w-[min(100%,720px)] flex-col gap-1 rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-violet-600/35 text-slate-100'
                    : 'border border-white/10 bg-slate-950/50 text-slate-200'
                }`}
              >
                <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  {m.role === 'user' ? 'You' : 'Assistant'}
                </span>
                <span className="whitespace-pre-wrap">{m.content}</span>
              </div>
            </div>
          ))
        )}
        <div aria-hidden ref={bottomRef} />
      </div>
      <div className="shrink-0 border-t border-white/10 bg-slate-950/60 p-4 backdrop-blur-sm">
        {composer}
      </div>
    </div>
  );
}
