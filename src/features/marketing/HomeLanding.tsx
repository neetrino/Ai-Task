import Link from 'next/link';
import { AiShell } from '@/features/marketing/AiShell';
import { AUTH_PRIMARY_CTA_HERO_CLASS } from '@/shared/ui/auth-cta-classes';
import { ArrowRightGlyph, SparklesGlyph } from '@/shared/ui/brand-icons';
import { SiteLogoImage } from '@/shared/ui/site-logo';

type HomeLandingProps = {
  variant: 'signed_out' | 'active' | 'pending';
};

const PREVIEW_TASKS = [
  { id: '1', title: 'Draft sprint goals from meeting notes', done: false },
  { id: '2', title: 'Break “API hardening” into subtasks', done: true },
  { id: '3', title: 'Sync approved tasks to Bitrix24', done: false },
] as const;

function TaskPreviewPanel() {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.1] bg-workspace-elevated/95 shadow-[0_0_0_1px_rgb(255_255_255/0.04),0_24px_80px_-24px_rgb(139_92_246/0.18)] ring-1 ring-violet-500/10 backdrop-blur-sm">
      <div className="border-b border-workspace-hairline bg-workspace-canvas px-5 py-4">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-neutral-300">
          <SparklesGlyph className="h-4 w-4 text-neutral-400" />
          AI task draft
        </div>
        <p className="mt-1 text-sm text-neutral-400">
          From your last brief: prioritized, ready to edit.
        </p>
      </div>
      <ul className="divide-y divide-white/[0.06] px-2 py-2">
        {PREVIEW_TASKS.map((task) => (
          <li className="flex items-start gap-3 px-3 py-3" key={task.id}>
            <span
              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-[10px] font-semibold ${
                task.done
                  ? 'border-emerald-700/80 bg-emerald-950 text-emerald-300'
                  : 'border-white/10 bg-neutral-800 text-neutral-400'
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
      <div className="border-t border-workspace-hairline bg-workspace-canvas px-5 py-3">
        <p className="text-xs text-neutral-500">
          <span className="font-medium text-neutral-300">Next:</span> refine owners & dates, then export or
          sync.
        </p>
      </div>
    </div>
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
      contentClassName="mx-auto flex min-h-screen max-w-6xl flex-col justify-center gap-14 px-6 py-16 lg:gap-[4.5rem]"
    >
      <section className="flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/25 bg-workspace-elevated/90 px-3.5 py-1.5 text-xs font-medium text-neutral-200 shadow-[0_0_48px_-12px_rgb(139_92_246/0.45)] backdrop-blur-md">
          <SiteLogoImage className="h-3.5 w-auto" heightPx={14} priority />
          <span className="bg-gradient-to-r from-violet-200 via-fuchsia-200 to-violet-300 bg-clip-text text-transparent">
            Aibonacci
          </span>
          <span className="text-neutral-400">· each step builds on the last</span>
        </div>
        <h1 className="mt-7 max-w-3xl text-4xl font-semibold tracking-tight text-neutral-100 sm:text-5xl sm:leading-[1.08]">
          Ideas become{' '}
          <span className="bg-gradient-to-r from-violet-200 via-fuchsia-200 to-violet-300 bg-clip-text text-transparent">
            actionable tasks
          </span>
          —fast.
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-neutral-400">
          Describe a goal in plain language. The assistant structures phases, subtasks, and
          handoff-ready Markdown—optionally synced to Bitrix24 when you are ready.
        </p>
        <div className="mt-12">
          <Link className={AUTH_PRIMARY_CTA_HERO_CLASS} href={primaryHref}>
            {primaryLabel}
            <ArrowRightGlyph className="h-5 w-5 text-slate-800" />
          </Link>
        </div>
      </section>

      <section className="flex flex-col items-stretch gap-12 lg:flex-row lg:items-start lg:justify-between lg:gap-20">
        <div className="grid w-full max-w-xl grid-cols-1 gap-10 sm:grid-cols-3 lg:max-w-none">
          <FeatureStat label="Natural input" value="Briefs & chat" />
          <FeatureStat label="Structured output" value="Tasks & phases" />
          <FeatureStat label="Integrations" value="MD & Bitrix24" />
        </div>
        <div className="mx-auto w-full max-w-md shrink-0 lg:mx-0">
          <TaskPreviewPanel />
        </div>
      </section>
    </AiShell>
  );
}

function FeatureStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-workspace-elevated/35 px-4 py-3.5 text-center shadow-[inset_0_1px_0_0_rgb(255_255_255/0.04)] backdrop-blur-sm lg:text-left">
      <div className="text-xs font-medium uppercase tracking-wide text-neutral-500">{label}</div>
      <div className="mt-1.5 text-sm font-medium text-neutral-200">{value}</div>
    </div>
  );
}
