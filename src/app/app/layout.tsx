import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/shared/lib/session';
import { AiShell } from '@/features/marketing/AiShell';

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session?.user) {
    redirect('/auth/signin');
  }

  return (
    <AiShell contentClassName="flex h-dvh min-h-0 flex-col overflow-hidden">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">{children}</div>
    </AiShell>
  );
}
