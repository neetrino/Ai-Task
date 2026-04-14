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
