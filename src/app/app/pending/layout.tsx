import type { ReactNode } from 'react';
import { accountDisplayLabel, getSession } from '@/shared/lib/session';
import { WorkspaceShellHeader } from '@/shared/ui/workspace-shell-header';

export default async function PendingLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  const accountLabel = accountDisplayLabel(session?.user);

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <WorkspaceShellHeader accountLabel={accountLabel} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">{children}</div>
    </div>
  );
}
