import Link from 'next/link';
import { AiShell } from '@/features/marketing/AiShell';
import { SignInForm } from '@/features/auth/SignInForm';

export default function SignInPage() {
  return (
    <AiShell contentClassName="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-10 px-6 py-16 text-center">
      <div className="w-full max-w-md">
        <p className="text-xs font-medium uppercase tracking-wider text-violet-300/90">PlanRelay</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Sign in to continue
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-slate-400">
          We will email you a magic link. In development, check server logs if Resend is not
          configured.
        </p>
      </div>
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-950/50 p-8 shadow-xl shadow-violet-950/30 backdrop-blur-md">
        <p className="mb-6 text-xs font-medium uppercase tracking-wide text-cyan-300/80">
          Enter your work email
        </p>
        <SignInForm />
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
