import { buildGoldenSpiralPath } from '@/features/marketing/fibonacci-spiral-path';

/** Fits viewBox 0–100; φ-growth curve for hero-corner decoration. */
const SPIRAL_PRIMARY = buildGoldenSpiralPath(50, 50, 2.35, 130, Math.PI * 3.15);
const SPIRAL_SECONDARY = buildGoldenSpiralPath(50, 50, 2.05, 110, Math.PI * 2.85);

/**
 * Decorative layer for public marketing/auth pages: golden spirals, φ-based glow orbs,
 * subtle grid. Pointer-events none; respects reduced-motion in CSS.
 */
export function FibonacciMarketingBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-workspace-canvas"
    >
      <div className="fib-backdrop-mesh absolute inset-0" />
      <div className="fib-orb-drift fib-orb-drift-delay fib-orb-golden-a fib-size-glow-lg absolute rounded-full bg-violet-600/25 blur-[100px]" />
      <div className="fib-orb-drift fib-orb-drift-offset fib-orb-golden-b fib-size-glow-md-scaled absolute rounded-full bg-fuchsia-600/20 blur-[90px]" />
      <div className="fib-orb-golden-c fib-size-glow-sm-scaled absolute rounded-full bg-violet-400/10 blur-[70px]" />
      <div className="fib-grid-fade absolute inset-0" />
      <svg
        className="fib-spiral-slow absolute -right-[18%] bottom-0 h-[min(72vh,560px)] w-[min(72vw,560px)] text-violet-400/25"
        preserveAspectRatio="xMidYMid meet"
        viewBox="0 0 100 100"
      >
        <defs>
          <linearGradient id="fib-spiral-grad" x1="0%" x2="100%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="rgb(167 139 250)" stopOpacity="0.5" />
            <stop offset="55%" stopColor="rgb(192 132 252)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="rgb(244 114 182)" stopOpacity="0.2" />
          </linearGradient>
        </defs>
        <path
          d={SPIRAL_PRIMARY}
          fill="none"
          stroke="url(#fib-spiral-grad)"
          strokeLinecap="round"
          strokeWidth="0.35"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <svg
        className="fib-spiral-slow fib-spiral-delay-negative absolute -left-[12%] -top-[8%] h-[min(48vh,380px)] w-[min(48vw,380px)] -scale-x-100 text-fuchsia-400/20"
        preserveAspectRatio="xMidYMid meet"
        viewBox="0 0 100 100"
      >
        <path
          d={SPIRAL_SECONDARY}
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="0.28"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}
