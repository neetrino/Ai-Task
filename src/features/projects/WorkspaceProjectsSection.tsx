'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useTransition, useActionState } from 'react';
import { toast } from 'sonner';
import { createProject, type CreateProjectState } from '@/features/projects/project-actions';
import { SparklesGlyph } from '@/shared/ui/brand-icons';
import {
  WORKSPACE_ACCENT_BTN_CLASS,
  WORKSPACE_FIELD_CLASS,
  WORKSPACE_LABEL_CLASS,
  WORKSPACE_PANEL_CLASS,
} from '@/shared/ui/workspace-ui';

export type ProjectListRow = {
  id: string;
  name: string;
  slug: string;
  updatedAt: string;
};

type DisplayRow = ProjectListRow & { pending?: boolean };

const PENDING_ROW_ID = 'pending-create';

function buildDisplayRows(
  serverProjects: ProjectListRow[],
  pendingName: string | null,
): DisplayRow[] {
  if (!pendingName) return serverProjects;
  const pendingRow: DisplayRow = {
    id: PENDING_ROW_ID,
    name: pendingName,
    slug: '',
    updatedAt: new Date().toISOString(),
    pending: true,
  };
  return [pendingRow, ...serverProjects];
}

export function WorkspaceProjectsSection({ initialProjects }: { initialProjects: ProjectListRow[] }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const prevStateRef = useRef<CreateProjectState | undefined>(undefined);
  const submitGuardRef = useRef(false);

  const [state, formAction] = useActionState(createProject, undefined);
  const [isPending, startTransition] = useTransition();
  const [pendingName, setPendingName] = useState<string | null>(null);

  useEffect(() => {
    if (!isPending) submitGuardRef.current = false;
  }, [isPending]);

  useEffect(() => {
    if (state === prevStateRef.current) return;
    prevStateRef.current = state;
    if (!state) return;
    if ('error' in state && state.error) {
      toast.error(state.error);
      setPendingName(null);
      return;
    }
    if ('success' in state && state.success) {
      formRef.current?.reset();
      setPendingName(null);
      router.refresh();
    }
  }, [state, router]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitGuardRef.current || isPending) return;
    submitGuardRef.current = true;
    const form = e.currentTarget;
    const fd = new FormData(form);
    const raw = fd.get('name');
    const name = typeof raw === 'string' ? raw.trim() : '';
    if (!name) {
      submitGuardRef.current = false;
      return;
    }
    setPendingName(name);
    startTransition(() => {
      void formAction(fd);
    });
  };

  const rows = buildDisplayRows(initialProjects, pendingName);

  return (
    <>
      <form
        ref={formRef}
        className={`flex flex-wrap items-end gap-4 p-5 ${WORKSPACE_PANEL_CLASS}`}
        onSubmit={handleSubmit}
      >
        <label className={`flex min-w-[200px] flex-1 flex-col gap-2 ${WORKSPACE_LABEL_CLASS}`} htmlFor="name">
          New project
          <input
            className={WORKSPACE_FIELD_CLASS}
            disabled={isPending}
            id="name"
            name="name"
            placeholder="Project name"
            required
            type="text"
          />
        </label>
        <button
          aria-busy={isPending}
          className={`${WORKSPACE_ACCENT_BTN_CLASS} disabled:pointer-events-none disabled:opacity-60`}
          disabled={isPending}
          type="submit"
        >
          {isPending ? 'Creating…' : 'Create'}
        </button>
      </form>

      <div className="relative">
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-1 rounded-[1.25rem] bg-gradient-to-br from-violet-500/15 via-transparent to-cyan-500/10 blur-2xl"
        />
        <div className={`relative overflow-hidden ${WORKSPACE_PANEL_CLASS}`}>
          <div className="border-b border-white/10 bg-gradient-to-r from-violet-500/10 to-cyan-500/10 px-5 py-4">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-violet-200/90">
              <SparklesGlyph className="h-4 w-4 text-cyan-300" />
              All projects
            </div>
            <p className="mt-1 text-sm text-slate-400">Open a project to continue planning.</p>
          </div>
          <ul className="divide-y divide-white/5">
            {rows.length === 0 ? (
              <li className="px-5 py-8 text-sm text-slate-400">No projects yet — add one above.</li>
            ) : (
              rows.map((p) => (
                <li key={p.id}>
                  {p.pending ? (
                    <div className="flex items-center justify-between gap-4 px-5 py-4 opacity-90">
                      <span className="font-medium text-slate-100">{p.name}</span>
                      <span className="shrink-0 text-xs font-medium text-cyan-300/90">Creating…</span>
                    </div>
                  ) : (
                    <Link
                      className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-white/[0.04]"
                      href={`/app/projects/${p.slug}`}
                    >
                      <span className="font-medium text-slate-100">{p.name}</span>
                      <span className="shrink-0 text-xs tabular-nums text-slate-500">
                        {p.updatedAt.slice(0, 10)}
                      </span>
                    </Link>
                  )}
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </>
  );
}
