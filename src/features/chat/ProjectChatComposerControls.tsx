export function SendOrStopControl({
  pending,
  onStop,
}: {
  pending: boolean;
  onStop: () => void;
}) {
  if (pending) {
    return (
      <button
        aria-label="Stop generation"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-neutral-900 transition hover:bg-white"
        onClick={(e) => {
          e.preventDefault();
          onStop();
        }}
        type="button"
      >
        <svg aria-hidden className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
          <rect height="14" rx="1" width="14" x="5" y="5" />
        </svg>
      </button>
    );
  }

  return (
    <button
      aria-label="Send message"
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-neutral-900 transition hover:bg-white disabled:opacity-50"
      type="submit"
    >
      <svg aria-hidden className="h-5 w-5" fill="none" viewBox="0 0 24 24">
        <path
          d="M12 19V5m0 0l-7 7m7-7l7 7"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      </svg>
    </button>
  );
}

export function AssistantPendingRow({ pending }: { pending: boolean }) {
  if (!pending) return null;
  return (
    <div className="text-[15px] leading-relaxed text-neutral-50">
      <span className="inline-flex items-center gap-2">
        <span
          aria-hidden
          className="inline-block h-2 w-2 animate-pulse rounded-full bg-neutral-400"
        />
        Updating plan…
      </span>
    </div>
  );
}
