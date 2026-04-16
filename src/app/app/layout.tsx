import Link from 'next/link';
import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AiShell } from '@/features/marketing/AiShell';
import { SiteLogoImage } from '@/shared/ui/site-logo';
import { WORKSPACE_GHOST_BTN_CLASS } from '@/shared/ui/workspace-ui';

/** Projects nav — same neutral “ghost” language as the workspace rail, not violet accent. */
const PROJECTS_NAV_CLASS = `inline-flex items-center gap-2 ${WORKSPACE_GHOST_BTN_CLASS}`;

/**
 * Account chip max width — keep inside the left phase rail (`TASKS_ASIDE_MIN_WIDTH_PX` in
 * `plan-tasks-layout.ts` is 260px; `2rem` leaves room for `left-*` inset and rail padding).
 */
const ACCOUNT_CHIP_MAX_CLASS = 'w-[min(calc(100vw-1.5rem),calc(260px-2rem))]';

/** Claude-style account chip — fixed bottom-left; width capped to the left rail. */
const ACCOUNT_FLOAT_CLASS = `fixed bottom-24 left-3 z-30 flex ${ACCOUNT_CHIP_MAX_CLASS} items-center gap-2.5 rounded-2xl border border-white/[0.1] bg-workspace-elevated/95 px-3 py-2.5 text-sm font-medium text-neutral-200 shadow-lg backdrop-blur-md transition hover:border-white/20 hover:bg-neutral-800/95 sm:left-4 lg:bottom-6`;

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session?.user) {
    redirect('/auth/signin');
  }
  const accountLabel =
    session.user.name?.trim() ||
    session.user.email?.split('@')[0]?.trim() ||
    'Account';

  return (
    <AiShell contentClassName="flex h-dvh min-h-0 flex-col overflow-hidden">
      <header className="shrink-0 w-full border-b border-workspace-hairline bg-workspace-rail">
        {/** Full-bleed row — no mx-auto/max-w so logo stays at the viewport left on ultra-wide screens. */}
        <div className="flex w-full min-w-0 items-center justify-between py-4 pl-3 pr-6 sm:pl-4 lg:pl-5">
          <div className="flex min-w-0 items-center gap-4 sm:gap-8">
            <Link
              className="flex shrink-0 items-center gap-2 font-semibold text-neutral-100"
              href="/app"
            >
              <SiteLogoImage className="h-7 w-auto" heightPx={28} priority />
              Aibonacci
            </Link>
            <Link className={PROJECTS_NAV_CLASS} href="/app">
              <svg aria-hidden className="h-4 w-4 shrink-0 opacity-90" fill="none" viewBox="0 0 24 24">
                <path
                  className="stroke-current"
                  d="M3 7.5V6a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v1.5M3 7.5h18v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-9Z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.75}
                />
              </svg>
              Projects
            </Link>
          </div>
        </div>
      </header>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">{children}</div>
      <Link className={ACCOUNT_FLOAT_CLASS} href="/app/account" title="Account settings">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/80 to-violet-700/90 text-xs font-bold uppercase text-white ring-1 ring-white/15">
          {accountLabel.slice(0, 2)}
        </span>
        <span className="min-w-0 flex-1 truncate text-left leading-tight">
          <span className="block text-xs font-normal text-neutral-500">My account</span>
          <span className="block truncate text-neutral-100">{accountLabel}</span>
        </span>
      </Link>
    </AiShell>
  );
}
