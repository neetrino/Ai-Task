export function SparklesGlyph({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M9.94 3.5c.23-.67.35-1 .64-1 .29 0 .41.33.64 1l.12.36c.13.39.2.58.33.73.14.16.33.24.72.4l.38.16c.67.27 1 .41 1 1.12 0 .71-.33.85-1 1.12l-.38.16c-.39.16-.58.24-.72.4-.13.15-.2.34-.33.73l-.12.36c-.23.67-.35 1-.64 1-.29 0-.41-.33-.64-1l-.12-.36c-.13-.39-.2-.58-.33-.73-.14-.16-.33-.24-.72-.4l-.38-.16c-.67-.27-1-.41-1-1.12 0-.71.33-.85 1-1.12l.38-.16c.39-.16.58-.24.72-.4.13-.15.2-.34.33-.73l.12-.36Z"
        fill="currentColor"
      />
      <path
        d="M16.5 12.75c.12-.35.18-.52.3-.6.13-.09.3-.05.65.03l.2.05c.35.09.52.13.6.3.09.17.05.34-.03.69l-.05.2c-.09.35-.13.52-.3.6-.17.09-.34.05-.69-.03l-.2-.05c-.35-.09-.52-.13-.6-.3-.09-.17-.05-.34.03-.69l.05-.2Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** Clipboard list — used for “Tasks” next to phase rows. */
export function ListChecksGlyph({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v0M9 12h6m-6 4h4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

/** Trash — delete / remove actions (outline, Hero-style). */
export function TrashOutlineGlyph({ className }: { className?: string }) {
  return (
    <svg aria-hidden className={className} fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path
        className="stroke-current"
        d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
      />
    </svg>
  );
}

/** Pencil — rename / edit actions (outline, Hero-style). */
export function PencilOutlineGlyph({ className }: { className?: string }) {
  return (
    <svg aria-hidden className={className} fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path
        className="stroke-current"
        d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
      />
    </svg>
  );
}

/** Magnifying glass — search fields. */
export function MagnifyingGlassGlyph({ className }: { className?: string }) {
  return (
    <svg aria-hidden className={className} fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path
        className="stroke-current"
        d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
      />
    </svg>
  );
}

export function ArrowRightGlyph({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4 10h11m0 0-4-4m4 4-4 4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}
