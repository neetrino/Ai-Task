import { AppHeaderAccount } from '@/shared/ui/app-header-account';
import { WorkspaceHomeLogoLink } from '@/shared/ui/workspace-shell-nav';

type WorkspaceShellHeaderProps = {
  accountLabel: string;
};

/**
 * Full-width app bar: logo + account — used on dashboard and account routes.
 * Projects link lives on the page itself (left rail / dashboard list), not in this header.
 */
export function WorkspaceShellHeader({ accountLabel }: WorkspaceShellHeaderProps) {
  return (
    <header className="shrink-0 w-full border-b border-workspace-hairline bg-workspace-rail">
      <div className="flex w-full min-w-0 items-center justify-between gap-3 py-4 pl-3 pr-6 sm:pl-4 lg:pl-5">
        <div className="flex min-w-0 flex-1 items-center">
          <WorkspaceHomeLogoLink priority />
        </div>
        <AppHeaderAccount accountLabel={accountLabel} />
      </div>
    </header>
  );
}
