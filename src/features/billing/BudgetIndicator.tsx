import type { BudgetSnapshot } from '@/features/billing/token-budget';

function formatTokens(value: number): string {
  if (value < 1000) return `${value}`;
  if (value < 1_000_000) return `${(value / 1000).toFixed(1)}k`;
  return `${(value / 1_000_000).toFixed(2)}M`;
}

function pctBar(used: number, cap: number | null): {
  pct: number;
  toneClass: string;
  label: string;
} {
  if (cap === null || cap <= 0) {
    return {
      pct: 0,
      toneClass: 'bg-neutral-700',
      label: `${formatTokens(used)} / ∞`,
    };
  }
  const pct = Math.min(100, Math.round((used / cap) * 100));
  let toneClass = 'bg-emerald-500/70';
  if (pct >= 100) toneClass = 'bg-rose-500/80';
  else if (pct >= 80) toneClass = 'bg-amber-400/80';
  return {
    pct,
    toneClass,
    label: `${formatTokens(used)} / ${formatTokens(cap)} (${pct}%)`,
  };
}

/**
 * Inline budget indicator: two stacked bars (user + project) with a tooltip
 * showing absolute tokens. Hidden entirely when neither cap is set.
 */
export function BudgetIndicator({ snapshot }: { snapshot: BudgetSnapshot }) {
  if (snapshot.userCap === null && snapshot.projectCap === null) {
    return null;
  }

  const user = pctBar(snapshot.userUsed, snapshot.userCap);
  const project = pctBar(snapshot.projectUsed, snapshot.projectCap);

  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-white/[0.06] bg-neutral-900/40 px-2.5 py-2 text-[11px] text-neutral-400">
      <div className="flex items-center justify-between gap-2">
        <span>Your tokens</span>
        <span className="text-neutral-500" title={user.label}>
          {user.label}
        </span>
      </div>
      <div className="h-1 w-full overflow-hidden rounded-full bg-neutral-800">
        <div
          className={`h-full rounded-full ${user.toneClass}`}
          style={{ width: `${Math.max(2, user.pct)}%` }}
        />
      </div>

      {snapshot.projectCap !== null ? (
        <>
          <div className="mt-0.5 flex items-center justify-between gap-2">
            <span>Project tokens</span>
            <span className="text-neutral-500" title={project.label}>
              {project.label}
            </span>
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-neutral-800">
            <div
              className={`h-full rounded-full ${project.toneClass}`}
              style={{ width: `${Math.max(2, project.pct)}%` }}
            />
          </div>
        </>
      ) : null}

      {snapshot.pressure === 'soft-warn' ? (
        <p className="mt-1 text-[10px] leading-tight text-amber-400/80">
          Approaching the limit — the router is downgrading to cheaper models.
        </p>
      ) : null}
      {snapshot.pressure === 'over-cap' ? (
        <p className="mt-1 text-[10px] leading-tight text-rose-400/90">
          Limit reached — new chat messages are blocked until the period
          resets.
        </p>
      ) : null}
    </div>
  );
}
