import type { ReactNode } from 'react';
import { FibonacciMarketingBackdrop } from '@/features/marketing/FibonacciMarketingBackdrop';

type AiShellProps = {
  children: ReactNode;
  /** Tailwind classes for the inner content wrapper (z-index above backdrop). */
  contentClassName: string;
  /** Public marketing/auth pages get the Fibonacci backdrop; app shell stays plain. */
  backdrop?: 'none' | 'marketing';
};

export function AiShell({ children, contentClassName, backdrop = 'none' }: AiShellProps) {
  const surfaceClass =
    backdrop === 'marketing' ? 'bg-black' : 'bg-workspace-canvas';
  return (
    <div className={`relative min-h-screen overflow-hidden ${surfaceClass} text-neutral-200 antialiased`}>
      {backdrop === 'marketing' ? <FibonacciMarketingBackdrop /> : null}
      <div className={`relative z-10 ${contentClassName}`}>{children}</div>
    </div>
  );
}
