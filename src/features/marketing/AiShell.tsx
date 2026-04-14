import type { ReactNode } from 'react';

function GridBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.07)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_30%,#000_45%,transparent)]"
    />
  );
}

function GlowOrbs() {
  return (
    <>
      <div
        aria-hidden
        className="home-aurora pointer-events-none absolute -left-32 top-1/4 h-[28rem] w-[28rem] rounded-full bg-violet-600/30 blur-[100px]"
      />
      <div
        aria-hidden
        className="home-aurora-delayed pointer-events-none absolute -right-24 bottom-0 h-[22rem] w-[22rem] rounded-full bg-cyan-500/20 blur-[90px]"
      />
    </>
  );
}

type AiShellProps = {
  children: ReactNode;
  /** Tailwind classes for the inner content wrapper (z-index above backdrop). */
  contentClassName: string;
};

export function AiShell({ children, contentClassName }: AiShellProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <GridBackdrop />
      <GlowOrbs />
      <div className={`relative z-10 ${contentClassName}`}>{children}</div>
    </div>
  );
}
