import Link from 'next/link';
import { AiShell } from '@/features/marketing/AiShell';
import {
  GOLDEN_RATIO_PHI,
  LANDING_FIBONACCI_STRIP,
  LANDING_FIB_STRIP_HIGHLIGHT,
} from '@/features/marketing/landing-constants';
import { AUTH_PRIMARY_CTA_HERO_CLASS } from '@/shared/ui/auth-cta-classes';
import { ArrowRightGlyph, ListChecksGlyph, SparklesGlyph } from '@/shared/ui/brand-icons';
import { SiteLogoImage } from '@/shared/ui/site-logo';

type HomeLandingProps = {
  variant: 'signed_out' | 'active' | 'pending';
};

const PREVIEW_TASKS = [
  { id: '1', title: 'Draft sprint goals from meeting notes', done: false },
  { id: '2', title: 'Break “API hardening” into subtasks', done: true },
  { id: '3', title: 'Sync approved tasks to Bitrix24', done: false },
] as const;

const NAV_PRIMARY_CLASS =
  'inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-900 shadow-sm transition hover:border-white hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400/80';

function TaskPreviewPanel() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-violet-500/15 bg-gradient-to-br from-neutral-900/95 via-neutral-950/98 to-black shadow-[0_0_0_1px_rgb(255_255_255/0.05),0_32px_100px_-28px_rgb(124_58_237/0.12),0_0_80px_-20px_rgb(139_92_246/0.15)] ring-1 ring-white/[0.06] backdrop-blur-md">
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-violet-600/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-12 -left-10 h-40 w-40 rounded-full bg-violet-600/10 blur-3xl" />
      <div className="relative border-b border-white/[0.08] bg-black/40 px-5 py-4">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-neutral-300">
          <SparklesGlyph className="h-4 w-4 text-violet-400/90" />
          AI task draft
        </div>
        <p className="mt-1 text-sm text-neutral-400">
          From your last brief: prioritized, ready to edit.
        </p>
      </div>
      <ul className="relative divide-y divide-white/[0.06] px-2 py-2">
        {PREVIEW_TASKS.map((task) => (
          <li className="flex items-start gap-3 px-3 py-3" key={task.id}>
            <span
              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-[10px] font-semibold ${
                task.done
                  ? 'border-emerald-700/80 bg-emerald-950 text-emerald-300'
                  : 'border-white/10 bg-neutral-900 text-neutral-500'
              }`}
            >
              {task.done ? '✓' : '○'}
            </span>
            <span
              className={`text-sm leading-snug ${
                task.done ? 'text-neutral-500 line-through decoration-neutral-600' : 'text-neutral-100'
              }`}
            >
              {task.title}
            </span>
          </li>
        ))}
      </ul>
      <div className="relative border-t border-white/[0.08] bg-black/35 px-5 py-3">
        <p className="text-xs text-neutral-500">
          <span className="font-medium text-neutral-300">Next:</span> refine owners & dates, then export or
          sync.
        </p>
      </div>
    </div>
  );
}

function FibonacciSequenceStrip() {
  return (
    <div className="min-w-0">
      <div
        aria-hidden
        className="landing-fib-strip-scroll flex max-w-full flex-nowrap items-center gap-x-1 overflow-x-auto overflow-y-hidden pb-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-neutral-600 sm:gap-x-1.5 sm:text-[11px] sm:tracking-[0.16em]"
      >
        <span className="mr-1 shrink-0 text-neutral-500 sm:mr-2">Sequence</span>
        {LANDING_FIBONACCI_STRIP.map((n, index) => (
          <span className="flex shrink-0 items-center gap-0.5 sm:gap-1" key={`${String(n)}-${String(index)}`}>
            {index > 0 ? <span className="text-violet-500/40">·</span> : null}
            <span
              className={`rounded border px-1.5 py-0.5 tabular-nums text-neutral-300 sm:px-2 ${
                n === LANDING_FIB_STRIP_HIGHLIGHT
                  ? 'border-violet-500/50 bg-violet-600/[0.12] shadow-[0_0_14px_-4px_rgb(124_58_237/0.35)]'
                  : 'border-white/[0.09] bg-white/[0.04]'
              }`}
            >
              {n}
            </span>
          </span>
        ))}
        <span className="shrink-0 pl-0.5 text-violet-400/50 sm:pl-1">∞</span>
      </div>
    </div>
  );
}

function BentoGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 shadow-[inset_0_1px_0_0_rgb(255_255_255/0.04)] transition hover:border-violet-500/20 sm:col-span-2 lg:col-span-1">
        <div className="pointer-events-none absolute right-4 top-4 font-mono text-5xl font-light leading-none text-white/[0.04] transition group-hover:text-violet-400/[0.07]">
          φ
        </div>
        <p className="text-xs font-medium uppercase tracking-wider text-violet-400/85">Golden continuity</p>
        <p className="mt-3 text-lg font-medium tracking-tight text-neutral-100">
          Each answer uses what came before—like terms in a Fibonacci sum.
        </p>
        <p className="mt-2 text-sm leading-relaxed text-neutral-500">
          Context compounds: phases, subtasks, and notes stay linked so nothing important gets orphaned.
        </p>
      </div>
      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 shadow-[inset_0_1px_0_0_rgb(255_255_255/0.04)] transition hover:border-violet-500/20">
        <ListChecksGlyph className="h-8 w-8 text-violet-400/80" />
        <p className="mt-4 text-sm font-semibold text-neutral-200">Structured output</p>
        <p className="mt-1.5 text-sm text-neutral-500">
          Plain-language in → phased tasks, checklists, and Markdown you can ship.
        </p>
      </div>
      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 shadow-[inset_0_1px_0_0_rgb(255_255_255/0.04)] transition hover:border-fuchsia-500/20">
        <p className="font-mono text-xs text-neutral-500">Bitrix24</p>
        <p className="mt-3 text-sm font-semibold text-neutral-200">Sync when you choose</p>
        <p className="mt-1.5 text-sm text-neutral-500">
          Draft here, then push to your workspace pipeline—no surprise overwrites.
        </p>
      </div>
    </div>
  );
}

type LandingCtaProps = {
  primaryHref: string;
  primaryLabel: string;
};

function LandingHeader({ primaryHref, primaryLabel }: LandingCtaProps) {
  return (
    <header className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <SiteLogoImage className="h-9 w-auto" heightPx={36} priority />
        <div className="flex flex-col">
          <span className="text-sm font-semibold tracking-tight text-neutral-100">Aibonacci</span>
          <span className="text-xs text-neutral-500">AI planning · Fibonacci rhythm</span>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <span className="hidden rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 font-mono text-[11px] text-neutral-400 sm:inline">
          φ ≈ {GOLDEN_RATIO_PHI}
        </span>
        <Link className={NAV_PRIMARY_CLASS} href={primaryHref}>
          {primaryLabel}
          <ArrowRightGlyph className="h-4 w-4 text-slate-800" />
        </Link>
      </div>
    </header>
  );
}

function LandingHeroCopy({ primaryHref, primaryLabel }: LandingCtaProps) {
  return (
    <div className="flex flex-col">
      <div className="inline-flex max-w-max flex-wrap items-center gap-2 rounded-full border border-violet-500/25 bg-black/50 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-violet-200/90 shadow-[0_0_40px_-12px_rgb(124_58_237/0.28)] backdrop-blur-md">
        <span className="text-neutral-400">Compounding</span>
        <span className="h-1 w-1 rounded-full bg-violet-400/60" />
        <span className="text-neutral-300">context-aware</span>
      </div>

      <h1 className="mt-8 max-w-xl text-4xl font-semibold tracking-tight text-neutral-50 sm:text-5xl sm:leading-[1.06]">
        Turn messy goals into a{' '}
        <span className="bg-gradient-to-r from-violet-200 via-neutral-100 to-violet-300 bg-clip-text text-transparent">
          sequence you can ship
        </span>
        .
      </h1>

      <p className="mt-6 max-w-lg text-base leading-relaxed text-neutral-400 sm:text-lg">
        Describe the outcome once. The assistant expands it into phases and tasks—each step grounded in your
        last brief, ready for Bitrix24 when you are.
      </p>

      <div className="mt-8">
        <FibonacciSequenceStrip />
      </div>

      <div className="mt-10 flex min-w-0 max-w-full flex-nowrap items-start gap-2 sm:gap-3">
        <Link className={`${AUTH_PRIMARY_CTA_HERO_CLASS} shrink-0`} href={primaryHref}>
          {primaryLabel}
          <ArrowRightGlyph className="h-5 w-5 text-slate-800" />
        </Link>
        <div className="landing-phi-pulse landing-phi-pulse-delay flex min-w-0 flex-1 items-start gap-2 font-mono text-[10px] leading-snug text-neutral-400 sm:gap-2 sm:text-xs">
          <span className="mt-1 shrink-0 leading-none text-violet-500/60">●</span>
          <span className="min-w-0">
            Models reason in passes—like adding the last two terms.
          </span>
        </div>
      </div>
    </div>
  );
}

function LandingHeroSection({ primaryHref, primaryLabel }: LandingCtaProps) {
  return (
    <section className="relative grid gap-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center lg:gap-16">
      <div className="landing-hero-grid pointer-events-none absolute inset-0 -z-10 opacity-[0.65] lg:opacity-100" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 hidden -translate-x-1/2 -translate-y-1/2 bg-gradient-to-br from-violet-300/[0.1] via-white/[0.05] to-violet-400/[0.08] bg-clip-text font-serif text-[clamp(12rem,36vw,22rem)] font-light leading-none text-transparent lg:block">
        φ
      </div>

      <LandingHeroCopy primaryHref={primaryHref} primaryLabel={primaryLabel} />

      <div className="relative mx-auto w-full max-w-md lg:mx-0 lg:max-w-none">
        <div className="pointer-events-none absolute -inset-4 rounded-[1.75rem] border border-dashed border-white/[0.07] opacity-70" />
        <div className="pointer-events-none absolute -inset-1 rounded-3xl bg-gradient-to-br from-violet-600/12 via-transparent to-violet-600/10 blur-xl" />
        <TaskPreviewPanel />
      </div>
    </section>
  );
}

function LandingFeaturesSection() {
  return (
    <section className="flex flex-col gap-8">
      <div className="max-w-2xl">
        <h2 className="text-2xl font-semibold tracking-tight text-neutral-100 sm:text-3xl">
          Built for momentum, not one-off prompts
        </h2>
        <p className="mt-3 text-neutral-500">
          Three surfaces—continuity, structure, and handoff—so your team stays aligned from ideation to
          execution.
        </p>
      </div>
      <BentoGrid />
    </section>
  );
}

function LandingFooter() {
  return (
    <footer className="mt-auto border-t border-white/[0.06] pt-10 text-center text-xs text-neutral-600">
      <p>Aibonacci — each step builds on the last.</p>
    </footer>
  );
}

export function HomeLanding({ variant }: HomeLandingProps) {
  const primaryHref =
    variant === 'signed_out' ? '/auth/signin' : variant === 'active' ? '/app' : '/app/pending';
  const primaryLabel =
    variant === 'signed_out' ? 'Sign in' : variant === 'active' ? 'Open workspace' : 'Access status';

  return (
    <AiShell
      backdrop="marketing"
      contentClassName="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col gap-16 px-5 py-10 sm:px-8 sm:py-14 lg:gap-24"
    >
      <LandingHeader primaryHref={primaryHref} primaryLabel={primaryLabel} />
      <LandingHeroSection primaryHref={primaryHref} primaryLabel={primaryLabel} />
      <LandingFeaturesSection />
      <LandingFooter />
    </AiShell>
  );
}
