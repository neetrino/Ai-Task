import Link from 'next/link';

/** Keeps long names from pushing the Projects nav on narrow viewports. */
const ACCOUNT_HEADER_MAX_W_CLASS = 'max-w-[min(100vw-10rem,15rem)] sm:max-w-[17rem]';

const ACCOUNT_HEADER_LINK_CLASS = `group inline-flex ${ACCOUNT_HEADER_MAX_W_CLASS} shrink-0 items-center gap-2 rounded-xl border border-white/[0.08] bg-neutral-800/45 px-2 py-1.5 pl-2 text-left shadow-sm transition hover:border-white/15 hover:bg-neutral-800/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/35`;

const ACCOUNT_AVATAR_CLASS =
  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/80 to-violet-700/90 text-[10px] font-bold uppercase leading-none text-white ring-1 ring-white/15 transition group-hover:ring-white/25';

type AppHeaderAccountProps = {
  accountLabel: string;
};

/**
 * Header entry point to `/app/account` — avatar, label, and display name.
 */
export function AppHeaderAccount({ accountLabel }: AppHeaderAccountProps) {
  const initials = accountLabel.slice(0, 2);
  return (
    <Link
      className={ACCOUNT_HEADER_LINK_CLASS}
      href="/app/account"
      title="Account settings"
      aria-label={`My account — ${accountLabel}`}
    >
      <span className={ACCOUNT_AVATAR_CLASS} aria-hidden>
        {initials}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] font-normal leading-tight text-neutral-500">My account</span>
        <span className="block truncate text-sm font-medium leading-tight text-neutral-100">{accountLabel}</span>
      </span>
    </Link>
  );
}
