import { WorkspaceHomeLogoLink, WorkspaceProjectsNavLink } from '@/shared/ui/workspace-shell-nav';

/**
 * Top of the project page left rail: logo + Projects nav (replaces the global app header on this route).
 * Account entry lives in the dashboard header, not on the project page rail.
 */
export function ProjectWorkspaceRailBranding() {
  return (
    <div className="shrink-0 border-b border-workspace-hairline px-2 pb-3 pt-4">
      <div className="flex min-w-0 items-center justify-between gap-3">
        <WorkspaceHomeLogoLink logoClassName="h-6 w-auto" logoHeightPx={24} priority />
        <WorkspaceProjectsNavLink />
      </div>
    </div>
  );
}
