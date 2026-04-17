'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { PencilOutlineGlyph, TrashOutlineGlyph } from '@/shared/ui/brand-icons';

const MENU_PANEL_CLASS =
  'absolute right-0 top-full z-[60] mt-1 min-w-[9.5rem] overflow-hidden rounded-md border border-white/[0.09] bg-workspace-elevated py-0.5 shadow-lg shadow-black/40';

const MENU_ICON_CLASS = 'h-3.5 w-3.5 shrink-0';

/** Compact row: smaller hit target, neater typography */
const MENU_ITEM_CLASS = `flex w-full items-center gap-1.5 px-2 py-1.5 text-left text-xs font-medium text-neutral-300 transition hover:bg-white/[0.06] focus:bg-white/[0.06] focus:outline-none`;

const MENU_ITEM_DANGER_CLASS = `flex w-full items-center gap-1.5 px-2 py-1.5 text-left text-xs font-medium text-rose-300/90 transition hover:bg-rose-500/10 focus:bg-rose-500/10 focus:outline-none`;

function DotsHorizontalIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden className={className} fill="currentColor" viewBox="0 0 24 24">
      <circle cx="5" cy="12" r="1.75" />
      <circle cx="12" cy="12" r="1.75" />
      <circle cx="19" cy="12" r="1.75" />
    </svg>
  );
}

function StarOutlineIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden className={className} fill="none" viewBox="0 0 24 24">
      <path
        className="stroke-current"
        d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 00-.84.611l-4.727-2.907a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 00-.84-.611l1.285-5.385a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 00.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
      />
    </svg>
  );
}

/**
 * Overflow menu for a phase row; Rename wires to inline edit. Other items are UI-only for now.
 */
export function PhaseRowMoreMenu({
  onRename,
  isRowEditing,
  isActiveRow = false,
}: {
  onRename: () => void;
  isRowEditing: boolean;
  /** Solid violet phase row — lighten trigger for contrast. */
  isActiveRow?: boolean;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  useEffect(() => {
    if (!menuOpen) return;
    function onDocDown(e: MouseEvent) {
      if (wrapRef.current?.contains(e.target as Node)) return;
      closeMenu();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closeMenu();
    }
    document.addEventListener('mousedown', onDocDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen, closeMenu]);

  const dotsVisible =
    menuOpen || isRowEditing
      ? 'opacity-100'
      : 'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100';

  const triggerToneClass = isActiveRow
    ? 'text-white/75 hover:bg-white/15 hover:text-white focus-visible:ring-white/40'
    : 'text-neutral-400 hover:bg-white/[0.08] hover:text-neutral-200 focus-visible:ring-violet-500/35';

  return (
    <div className="relative shrink-0" ref={wrapRef}>
      <button
        aria-controls={menuOpen ? menuId : undefined}
        aria-expanded={menuOpen}
        aria-haspopup="menu"
        aria-label="Phase options"
        className={`rounded-md p-1 transition focus:outline-none focus-visible:opacity-100 focus-visible:ring-2 ${triggerToneClass} ${dotsVisible}`}
        onClick={() => setMenuOpen((v) => !v)}
        type="button"
      >
        <DotsHorizontalIcon className="h-4 w-4" />
      </button>
      {menuOpen ? (
        <ul className={MENU_PANEL_CLASS} id={menuId} role="menu">
          <li role="none">
            <button
              className={MENU_ITEM_CLASS}
              onClick={() => {
                closeMenu();
                onRename();
              }}
              role="menuitem"
              type="button"
            >
              <PencilOutlineGlyph className={`${MENU_ICON_CLASS} text-neutral-500`} />
              Rename
            </button>
          </li>
          <li role="none">
            <button
              className={MENU_ITEM_CLASS}
              onClick={closeMenu}
              role="menuitem"
              type="button"
            >
              <StarOutlineIcon className={`${MENU_ICON_CLASS} text-neutral-500`} />
              Favorites
            </button>
          </li>
          <li className="mt-0.5 border-t border-white/[0.06] pt-0.5" role="none">
            <button
              className={MENU_ITEM_DANGER_CLASS}
              onClick={closeMenu}
              role="menuitem"
              type="button"
            >
              <TrashOutlineGlyph className={MENU_ICON_CLASS} />
              Delete
            </button>
          </li>
        </ul>
      ) : null}
    </div>
  );
}
