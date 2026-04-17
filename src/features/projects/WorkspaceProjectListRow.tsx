'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { renameProject } from '@/features/projects/project-actions';
import { PencilOutlineGlyph } from '@/shared/ui/brand-icons';
import {
  WORKSPACE_ACCENT_BTN_CLASS,
  WORKSPACE_FIELD_CLASS,
  WORKSPACE_GHOST_BTN_CLASS,
  WORKSPACE_GLASS_ROW_HOVER_CLASS,
} from '@/shared/ui/workspace-ui';

const RENAME_ICON_BTN_CLASS =
  'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 text-neutral-400 transition group-hover:border-white/20 group-hover:bg-white/[0.07] group-hover:text-neutral-200 hover:border-white/15 hover:bg-white/[0.06] hover:text-neutral-200 disabled:pointer-events-none disabled:opacity-60';

export type ProjectListRow = {
  id: string;
  name: string;
  slug: string;
  updatedAt: string;
};

type WorkspaceProjectListRowProps = { project: ProjectListRow };

export function WorkspaceProjectListRow({ project }: WorkspaceProjectListRowProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(project.name);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!editing) {
      setDraft(project.name);
    }
  }, [project.name, editing]);

  function cancelEdit() {
    setDraft(project.name);
    setEditing(false);
  }

  function save() {
    const trimmed = draft.trim();
    if (!trimmed) {
      toast.error('Enter a project name.');
      return;
    }
    if (trimmed === project.name) {
      setEditing(false);
      return;
    }
    startTransition(async () => {
      const result = await renameProject(project.id, trimmed);
      if ('error' in result) {
        toast.error(result.error);
        return;
      }
      toast.success('Project renamed.');
      setEditing(false);
      router.refresh();
    });
  }

  function onDraftKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      save();
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      cancelEdit();
    }
  }

  if (editing) {
    return (
      <>
        <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <label className="sr-only" htmlFor={`rename-project-${project.id}`}>
            Project name
          </label>
          <input
            className={`min-w-0 flex-1 ${WORKSPACE_FIELD_CLASS}`}
            id={`rename-project-${project.id}`}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onDraftKeyDown}
            type="text"
            value={draft}
          />
          <div className="flex shrink-0 gap-2">
            <button
              className={WORKSPACE_GHOST_BTN_CLASS}
              disabled={isPending}
              onClick={cancelEdit}
              type="button"
            >
              Cancel
            </button>
            <button
              aria-busy={isPending}
              className={WORKSPACE_ACCENT_BTN_CLASS}
              disabled={isPending}
              onClick={save}
              type="button"
            >
              {isPending ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div
        className={`${WORKSPACE_GLASS_ROW_HOVER_CLASS} relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4`}
      >
        <Link className="absolute inset-0 z-0 rounded-2xl" href={`/app/projects/${project.slug}`}>
          <span className="sr-only">Open project {project.name}</span>
        </Link>
        <div
          aria-hidden
          className="relative z-[1] flex min-w-0 flex-1 items-center justify-between gap-4 pointer-events-none sm:min-h-[2.25rem]"
        >
          <span className="font-medium text-neutral-100">{project.name}</span>
          <span className="shrink-0 text-xs tabular-nums text-neutral-500">
            {project.updatedAt.slice(0, 10)}
          </span>
        </div>
        <button
          aria-label={`Rename project ${project.name}`}
          className={`relative z-[2] self-start sm:self-center ${RENAME_ICON_BTN_CLASS}`}
          disabled={isPending}
          onClick={(e) => {
            e.preventDefault();
            setDraft(project.name);
            setEditing(true);
          }}
          type="button"
        >
          <PencilOutlineGlyph className="h-4 w-4" />
        </button>
      </div>
    </>
  );
}
