import Link from 'next/link';
import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AiShell } from '@/features/marketing/AiShell';
import { signOutAction } from '@/features/auth/auth-actions';

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session?.user) {
    redirect('/auth/signin');
  }
  return (
    <AiShell contentClassName="flex min-h-screen flex-col">
      <header className="border-b border-white/10 bg-slate-950/50 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-6 py-4">
          <div className="flex items-center gap-8">
            <Link className="font-semibold text-slate-100" href="/app">
              PlanRelay
            </Link>
            <Link
              className="text-sm text-violet-200/80 transition hover:text-white"
              href="/"
            >
              Home
            </Link>
          </div>
          <form action={signOutAction}>
            <button
              className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-sm text-slate-200 transition hover:border-white/25 hover:bg-white/10"
              type="submit"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>
      <div className="mx-auto w-full max-w-[1600px] flex-1 px-6 py-8">{children}</div>
    </AiShell>
  );
}
