import Link from 'next/link';
import { AiShell } from '@/features/marketing/AiShell';
import { SignInForm } from '@/features/auth/SignInForm';
import { SiteLogoImage } from '@/shared/ui/site-logo';

export default function SignInPage() {
  return (
    <AiShell
      backdrop="marketing"
      contentClassName="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-10 px-6 py-16 text-center"
    >
      <div className="w-full max-w-md space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-workspace-elevated/90 px-3.5 py-1.5 text-xs font-medium text-neutral-200 shadow-[0_0_40px_-10px_rgb(139_92_246/0.4)] backdrop-blur-md">
          <SiteLogoImage className="h-3.5 w-auto" heightPx={14} priority />
          <span className="bg-gradient-to-r from-violet-200 via-fuchsia-200 to-violet-300 bg-clip-text text-transparent">
            Aibonacci.am
          </span>
        </div>
        <h1 className="bg-gradient-to-br from-white via-neutral-100 to-neutral-400 bg-clip-text text-3xl font-semibold tracking-tight text-transparent sm:text-4xl">
          Sign in
        </h1>
        <p className="text-sm leading-relaxed text-neutral-400">
          We will send a one-time link to your inbox. Without Resend in development, the link is
          logged on the server instead.
        </p>
      </div>
      <div className="w-full max-w-md rounded-2xl border border-violet-500/25 bg-gradient-to-b from-violet-950/[0.28] via-workspace-elevated/90 to-[#2a2a2a] p-8 shadow-[0_0_0_1px_rgb(255_255_255/0.05),0_28px_90px_-28px_rgb(139_92_246/0.35)] backdrop-blur-md">
        <SignInForm />
      </div>
      <Link
        className="text-sm text-neutral-400 underline decoration-white/20 underline-offset-4 transition hover:text-neutral-200"
        href="/"
      >
        Back home
      </Link>
    </AiShell>
  );
}
