import Link from 'next/link';
import { AiShell } from '@/features/marketing/AiShell';

export default function VerifyPage() {
  return (
    <AiShell contentClassName="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-6 px-6 py-16">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-violet-300/90">PlanRelay</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Check your email</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-400">
          We sent you a sign-in link. After clicking it, you will be redirected to the app.
        </p>
      </div>
      <Link
        className="text-sm text-violet-300/90 underline decoration-violet-500/40 underline-offset-4 transition hover:text-cyan-200/90"
        href="/"
      >
        Back home
      </Link>
    </AiShell>
  );
}
