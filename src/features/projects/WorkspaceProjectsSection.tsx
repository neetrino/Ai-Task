'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState, useTransition, useActionState } from 'react';
import { toast } from 'sonner';
import { createProject, type CreateProjectState } from '@/features/projects/project-actions';
import {
  WorkspaceProjectListRow,
  type ProjectListRow,
} from '@/features/projects/WorkspaceProjectListRow';
import { MagnifyingGlassGlyph } from '@/shared/ui/brand-icons';
import { WORKSPACE_PANEL_CLASS, WORKSPACE_TOOLBAR_3D_ISLAND_CLASS } from '@/shared/ui/workspace-ui';

export type { ProjectListRow };

type DisplayRow = ProjectListRow & { pending?: boolean };

const PENDING_ROW_ID = 'pending-create';

/** Search column (~70% width on desktop). */
const PROJECTS_SEARCH_FIELD_WRAP_CLASS = 'relative min-w-0';

/**
 * Single toolbar: search ~70% + create ~30% on one strip (stacks on narrow viewports).
 * `7fr` / `3fr` keeps the ratio without magic percentages in multiple places.
 */
const PROJECTS_TOOLBAR_CLASS =
  'grid w-full grid-cols-1 gap-3 sm:grid-cols-[minmax(0,7fr)_minmax(0,3fr)] sm:items-center sm:gap-4';

/** Inputs inside the shell: no box border — they sit on the shared lift. */
const PROJECTS_TOOLBAR_INPUT_INNER_CLASS =
  'w-full rounded-xl border-0 bg-transparent py-2.5 pl-10 pr-3 text-sm text-neutral-100 placeholder:text-neutral-500 shadow-none outline-none ring-0 transition focus:bg-white/[0.04] focus:ring-2 focus:ring-violet-500/35';

const PROJECTS_TOOLBAR_NAME_INNER_CLASS =
  'min-w-0 flex-1 rounded-xl border-0 bg-transparent px-3 py-2.5 text-sm text-neutral-100 placeholder:text-neutral-500 shadow-none outline-none ring-0 transition focus:bg-white/[0.04] focus:ring-2 focus:ring-violet-500/35';

/** Tighter create row: slightly smaller gaps and button padding. */
const PROJECTS_CREATE_FORM_CLASS = 'flex min-w-0 flex-row items-center gap-2';

/** Primary Create — solid violet, 3D shadow + top specular (no gradient). */
const PROJECTS_CREATE_BTN_CLASS =
  'shrink-0 rounded-xl border-0 bg-violet-600 px-4 py-2.5 text-sm font-medium text-white shadow-[0_8px_24px_-10px_rgba(91,33,182,0.55),0_4px_12px_-6px_rgba(0,0,0,0.4),inset_0_1px_0_0_rgba(255,255,255,0.2)] outline-none transition hover:bg-violet-500 hover:shadow-[0_10px_28px_-10px_rgba(91,33,182,0.5),inset_0_1px_0_0_rgba(255,255,255,0.22)] focus-visible:ring-2 focus-visible:ring-violet-400/50 disabled:pointer-events-none disabled:opacity-60 sm:px-4';

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
  const [projectSearch, setProjectSearch] = useState('');

  const filteredRows = useMemo(() => {
    const built = buildDisplayRows(initialProjects, pendingName);
    const q = projectSearch.trim().toLowerCase();
    if (!q) {
      return built;
    }
    return built.filter((row) => {
      if (row.pending) {
        return true;
      }
      return row.name.toLowerCase().includes(q) || row.slug.toLowerCase().includes(q);
    });
  }, [initialProjects, pendingName, projectSearch]);

  const hasAnyProjects = initialProjects.length > 0 || pendingName !== null;
  const searchActive = projectSearch.trim().length > 0;

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

  return (
    <>
      <div className={`overflow-hidden ${WORKSPACE_PANEL_CLASS}`}>
        <div className="border-b border-workspace-hairline bg-workspace-canvas px-5 py-4">
          <div className={PROJECTS_TOOLBAR_CLASS}>
            <div className={`${WORKSPACE_TOOLBAR_3D_ISLAND_CLASS} min-w-0`}>
              <div className={PROJECTS_SEARCH_FIELD_WRAP_CLASS}>
                <MagnifyingGlassGlyph className="pointer-events-none absolute left-3 top-1/2 z-[1] h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <label className="sr-only" htmlFor="workspace-project-search">
                  Search projects
                </label>
                <input
                  autoComplete="off"
                  className={PROJECTS_TOOLBAR_INPUT_INNER_CLASS}
                  id="workspace-project-search"
                  onChange={(e) => setProjectSearch(e.target.value)}
                  placeholder="Search…"
                  type="search"
                  value={projectSearch}
                />
              </div>
            </div>

            <form
              ref={formRef}
              className={`${WORKSPACE_TOOLBAR_3D_ISLAND_CLASS} ${PROJECTS_CREATE_FORM_CLASS} min-w-0`}
              onSubmit={handleSubmit}
            >
              <label className="sr-only" htmlFor="name">
                New project
              </label>
              <input
                className={PROJECTS_TOOLBAR_NAME_INNER_CLASS}
                disabled={isPending}
                id="name"
                name="name"
                placeholder="Name…"
                required
                type="text"
              />
              <button
                aria-busy={isPending}
                className={PROJECTS_CREATE_BTN_CLASS}
                disabled={isPending}
                type="submit"
              >
                {isPending ? 'Creating…' : 'Create'}
              </button>
            </form>
          </div>
        </div>
        <ul className="flex flex-col divide-y divide-white/[0.03] px-1 py-2">
          {!hasAnyProjects ? (
            <li className="px-5 py-8 text-sm text-neutral-500">No projects yet — add one above.</li>
          ) : filteredRows.length === 0 ? (
            <li className="px-5 py-8 text-sm text-neutral-500">
              {searchActive ? 'No projects match your search.' : 'No projects yet — add one above.'}
            </li>
          ) : (
            filteredRows.map((p) => (
              <li key={p.id}>
                {p.pending ? (
                  <div className="flex items-center justify-between gap-4 px-5 py-4 opacity-90">
                    <span className="font-medium text-neutral-100">{p.name}</span>
                    <span className="shrink-0 text-xs font-medium text-neutral-400">Creating…</span>
                  </div>
                ) : (
                  <WorkspaceProjectListRow project={p} />
                )}
              </li>
            ))
          )}
        </ul>
      </div>
    </>
  );
}
