import Link from 'next/link';
import { SiteLogoImage } from '@/shared/ui/site-logo';
import { WORKSPACE_GHOST_BTN_CLASS } from '@/shared/ui/workspace-ui';

/** Projects nav — same neutral “ghost” language as the workspace rail. */
export const WORKSPACE_PROJECTS_NAV_CLASS = `inline-flex items-center gap-2 ${WORKSPACE_GHOST_BTN_CLASS}`;

const PROJECTS_FOLDER_ICON = (
  <svg aria-hidden className="h-4 w-4 shrink-0 opacity-90" fill="none" viewBox="0 0 24 24">
    <path
      className="stroke-current"
      d="M3 7.5V6a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v1.5M3 7.5h18v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-9Z"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.75}
    />
  </svg>
);

type WorkspaceHomeLogoLinkProps = {
  /** Logo size — header uses larger; rail matches compact sidebar. */
  logoHeightPx?: number;
  logoClassName?: string;
  priority?: boolean;
};

/**
 * App home logo + wordmark (links to `/app`).
 */
export function WorkspaceHomeLogoLink({
  logoHeightPx = 28,
  logoClassName = 'h-7 w-auto',
  priority = false,
}: WorkspaceHomeLogoLinkProps) {
  return (
    <Link
      className="flex min-w-0 shrink-0 items-center gap-2 font-semibold text-neutral-100"
      href="/app"
    >
      <SiteLogoImage className={logoClassName} heightPx={logoHeightPx} priority={priority} />
      Aibonacci
    </Link>
  );
}

/**
 * “Projects” link to the workspace project list.
 */
export function WorkspaceProjectsNavLink() {
  return (
    <Link className={WORKSPACE_PROJECTS_NAV_CLASS} href="/app">
      {PROJECTS_FOLDER_ICON}
      Projects
    </Link>
  );
}
