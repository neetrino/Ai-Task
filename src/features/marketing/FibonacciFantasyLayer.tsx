import { buildPhyllotaxisSeeds } from '@/features/marketing/fibonacci-phyllotaxis';

/** Seeds in viewBox 0–100; tuned so the spiral fills the hero without clipping. */
const PHYLLO_COUNT = 34;
const PHYLLO_SCALE = 4.15;
const VIEW_CENTER = 50;
const SEED_RADIUS_BASE = 0.42;

function FantasyAurora() {
  return (
    <div
      aria-hidden
      className="fib-fantasy-aurora pointer-events-none absolute -inset-[18%] blur-[44px]"
    />
  );
}

function FantasyRings() {
  const ringBase =
    'fib-fantasy-ring pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed';

  return (
    <div aria-hidden className="fib-fantasy-rings pointer-events-none absolute inset-0 z-0">
      <div
        className={`${ringBase} fib-fantasy-ring-a h-[min(46vw,420px)] w-[min(46vw,420px)] border-violet-400/30 shadow-[0_0_60px_-8px_rgb(124_58_237/0.28)]`}
      />
      <div
        className={`${ringBase} fib-fantasy-ring-b h-[min(64vw,580px)] w-[min(64vw,580px)] border-violet-400/22`}
      />
      <div
        className={`${ringBase} fib-fantasy-ring-c h-[min(82vw,740px)] w-[min(82vw,740px)] border-fuchsia-400/18`}
      />
    </div>
  );
}

function PhyllotaxisField() {
  const seeds = buildPhyllotaxisSeeds(PHYLLO_COUNT, PHYLLO_SCALE, VIEW_CENTER, VIEW_CENTER);

  return (
    <svg
      aria-hidden
      className="fib-phy pointer-events-none absolute left-1/2 top-1/2 z-[1] h-[min(120vmin,920px)] w-[min(120vmin,920px)] -translate-x-1/2 -translate-y-1/2 opacity-[0.92]"
      preserveAspectRatio="xMidYMid meet"
      viewBox="0 0 100 100"
    >
      <defs>
        <radialGradient cx="50%" cy="50%" id="fib-phy-seed-glow" r="50%">
          <stop offset="0%" stopColor="rgb(124 58 237)" stopOpacity="0.9" />
          <stop offset="45%" stopColor="rgb(167 139 250)" stopOpacity="0.55" />
          <stop offset="100%" stopColor="rgb(244 114 182)" stopOpacity="0" />
        </radialGradient>
        <filter id="fib-phy-soft-glow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur result="b" stdDeviation="0.35" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {seeds.map((seed, index) => {
        const r = SEED_RADIUS_BASE + seed.tier * 0.11;
        return (
          <circle
            className="fib-phy-seed"
            cx={seed.cx}
            cy={seed.cy}
            filter="url(#fib-phy-soft-glow)"
            key={`phy-${String(index)}`}
            fill="url(#fib-phy-seed-glow)"
            r={r}
          />
        );
      })}
    </svg>
  );
}

/**
 * Dreamlike Fibonacci motion: aurora drift, φ-spiral seeds, breathing rings.
 * Decorative only; respects `prefers-reduced-motion` via CSS.
 */
export function FibonacciFantasyLayer() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <FantasyAurora />
      <FantasyRings />
      <PhyllotaxisField />
    </div>
  );
}
