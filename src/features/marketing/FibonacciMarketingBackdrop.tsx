import { FibonacciFantasyLayer } from '@/features/marketing/FibonacciFantasyLayer';
import { GoldenRatioRibbon } from '@/features/marketing/GoldenRatioRibbon';
import { buildGoldenSpiralPath } from '@/features/marketing/fibonacci-spiral-path';

/** Fits viewBox 0–100; φ-growth curve for hero-corner decoration. */
const SPIRAL_PRIMARY = buildGoldenSpiralPath(50, 50, 2.35, 130, Math.PI * 3.15);
const SPIRAL_SECONDARY = buildGoldenSpiralPath(50, 50, 2.05, 110, Math.PI * 2.85);

/**
 * Decorative layer for public marketing/auth pages: φ spirals, glow orbs (violet-first),
 * subtle grid. Pointer-events none; respects reduced-motion in CSS.
 */
export function FibonacciMarketingBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-black"
    >
      <div className="fib-backdrop-mesh-ink absolute inset-0" />
      <div className="fib-orb-drift fib-orb-drift-delay fib-orb-golden-a fib-size-glow-lg absolute rounded-full bg-violet-600/[0.14] blur-[100px]" />
      <div className="fib-orb-drift fib-orb-drift-offset fib-orb-golden-b fib-size-glow-md-scaled absolute rounded-full bg-violet-500/[0.11] blur-[90px]" />
      <div className="fib-orb-golden-c fib-size-glow-sm-scaled absolute rounded-full bg-fuchsia-500/[0.09] blur-[70px]" />
      <div className="fib-grid-fade-landing absolute inset-0" />
      <GoldenRatioRibbon className="absolute bottom-[12%] left-[4%] w-[min(92vw,520px)] opacity-[0.55] sm:bottom-[14%] sm:left-[6%]" />
      <svg
        className="fib-spiral-slow fib-spiral-hue absolute -right-[18%] bottom-0 h-[min(72vh,560px)] w-[min(72vw,560px)] text-violet-400/32"
        preserveAspectRatio="xMidYMid meet"
        viewBox="0 0 100 100"
      >
        <defs>
          <linearGradient id="fib-spiral-grad" x1="0%" x2="100%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="rgb(139 92 246)" stopOpacity="0.48" />
            <stop offset="45%" stopColor="rgb(167 139 250)" stopOpacity="0.34" />
            <stop offset="100%" stopColor="rgb(244 114 182)" stopOpacity="0.22" />
          </linearGradient>
        </defs>
        <path
          d={SPIRAL_PRIMARY}
          fill="none"
          stroke="url(#fib-spiral-grad)"
          strokeLinecap="round"
          strokeWidth="0.42"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <svg
        className="fib-spiral-slow fib-spiral-delay-negative fib-spiral-hue absolute -left-[12%] -top-[8%] h-[min(48vh,380px)] w-[min(48vw,380px)] -scale-x-100 text-violet-400/28"
        preserveAspectRatio="xMidYMid meet"
        viewBox="0 0 100 100"
      >
        <path
          d={SPIRAL_SECONDARY}
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="0.34"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <FibonacciFantasyLayer />
    </div>
  );
}
