import Link from 'next/link';
import { AiShell } from '@/features/marketing/AiShell';
import { AUTH_PRIMARY_CTA_HERO_CLASS } from '@/shared/ui/auth-cta-classes';

type HomeLandingProps = {
  isAuthenticated: boolean;
};

const PREVIEW_TASKS = [
  { id: '1', title: 'Draft sprint goals from meeting notes', done: false },
  { id: '2', title: 'Break “API hardening” into subtasks', done: true },
  { id: '3', title: 'Sync approved tasks to Bitrix24', done: false },
] as const;

function SparklesGlyph({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M9.94 3.5c.23-.67.35-1 .64-1 .29 0 .41.33.64 1l.12.36c.13.39.2.58.33.73.14.16.33.24.72.4l.38.16c.67.27 1 .41 1 1.12 0 .71-.33.85-1 1.12l-.38.16c-.39.16-.58.24-.72.4-.13.15-.2.34-.33.73l-.12.36c-.23.67-.35 1-.64 1-.29 0-.41-.33-.64-1l-.12-.36c-.13-.39-.2-.58-.33-.73-.14-.16-.33-.24-.72-.4l-.38-.16c-.67-.27-1-.41-1-1.12 0-.71.33-.85 1-1.12l.38-.16c.39-.16.58-.24.72-.4.13-.15.2-.34.33-.73l.12-.36Z"
        fill="currentColor"
      />
      <path
        d="M16.5 12.75c.12-.35.18-.52.3-.6.13-.09.3-.05.65.03l.2.05c.35.09.52.13.6.3.09.17.05.34-.03.69l-.05.2c-.09.35-.13.52-.3.6-.17.09-.34.05-.69-.03l-.2-.05c-.35-.09-.52-.13-.6-.3-.09-.17-.05-.34.03-.69l.05-.2Z"
        fill="currentColor"
      />
    </svg>
  );
}

function ArrowRightGlyph({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4 10h11m0 0-4-4m4 4-4 4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function TaskPreviewPanel() {
  return (
    <div className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-4 rounded-[1.75rem] bg-gradient-to-br from-violet-500/25 via-cyan-500/15 to-transparent blur-2xl"
      />
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-950/60 shadow-2xl shadow-violet-950/40 backdrop-blur-xl">
        <div className="border-b border-white/10 bg-gradient-to-r from-violet-500/10 to-cyan-500/10 px-5 py-4">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-violet-200/90">
            <SparklesGlyph className="h-4 w-4 text-cyan-300" />
            AI task draft
          </div>
          <p className="mt-1 text-sm text-slate-300">
            From your last brief: prioritized, ready to edit.
          </p>
        </div>
        <ul className="divide-y divide-white/5 px-2 py-2">
          {PREVIEW_TASKS.map((task) => (
            <li className="flex items-start gap-3 px-3 py-3" key={task.id}>
              <span
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-[10px] font-semibold ${
                  task.done
                    ? 'border-emerald-400/50 bg-emerald-500/15 text-emerald-300'
                    : 'border-white/15 bg-white/5 text-slate-400'
                }`}
              >
                {task.done ? '✓' : '○'}
              </span>
              <span
                className={`text-sm leading-snug ${
                  task.done ? 'text-slate-500 line-through decoration-slate-600' : 'text-slate-100'
                }`}
              >
                {task.title}
              </span>
            </li>
          ))}
        </ul>
        <div className="border-t border-white/10 bg-white/[0.03] px-5 py-3">
          <p className="text-xs text-slate-400">
            <span className="font-medium text-cyan-300/90">Next:</span> refine owners & dates, then
            export or sync.
          </p>
        </div>
      </div>
    </div>
  );
}

export function HomeLanding({ isAuthenticated }: HomeLandingProps) {
  const primaryHref = isAuthenticated ? '/app' : '/auth/signin';
  const primaryLabel = isAuthenticated ? 'Open workspace' : 'Sign in';

  return (
    <AiShell contentClassName="mx-auto flex min-h-screen max-w-6xl flex-col justify-center gap-14 px-6 py-16 lg:gap-16">
      <section className="flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/25 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-200/95 backdrop-blur-sm">
          <SparklesGlyph className="h-3.5 w-3.5 text-cyan-300" />
          PlanRelay · AI-assisted planning
        </div>
        <h1 className="mt-6 max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl sm:leading-[1.1]">
          Ideas become{' '}
          <span className="bg-gradient-to-r from-violet-300 via-fuchsia-200 to-cyan-300 bg-clip-text text-transparent">
            actionable tasks
          </span>
          —fast.
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-400">
          Describe a goal in plain language. The assistant structures phases, subtasks, and
          handoff-ready Markdown—optionally synced to Bitrix24 when you are ready.
        </p>
        <div className="relative mt-12">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -m-6 rounded-full bg-cyan-400/15 blur-3xl"
          />
          <Link className={`relative ${AUTH_PRIMARY_CTA_HERO_CLASS}`} href={primaryHref}>
            {primaryLabel}
            <ArrowRightGlyph className="h-5 w-5 text-slate-800" />
          </Link>
        </div>
      </section>

      <section className="flex flex-col items-stretch gap-12 lg:flex-row lg:items-start lg:justify-between lg:gap-16">
        <div className="grid w-full max-w-xl grid-cols-1 gap-8 sm:grid-cols-3 lg:max-w-none">
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
    <div className="text-center lg:text-left">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-medium text-slate-200">{value}</div>
    </div>
  );
}
