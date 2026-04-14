import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChatPanel } from '@/features/chat/ChatPanel';
import { SyncToolbar } from '@/features/bitrix-sync/SyncToolbar';
import { BitrixSettingsForm } from '@/features/projects/BitrixSettingsForm';
import { getProjectForUser } from '@/features/projects/project-queries';
import { PhaseSection } from '@/features/phases/PhaseSection';
import { PlanEditor } from '@/features/plan-editor/PlanEditor';
import { ChatModelForm } from '@/features/projects/ChatModelForm';
import { DEFAULT_PLAN, parsePlanFromJson, type PlanPayload } from '@/shared/domain/plan';
import { getEffectiveChatModel, getEnvDefaultChatModel } from '@/shared/lib/openai-model';
import { prisma } from '@/shared/lib/prisma';
import { requireSessionUserId } from '@/shared/lib/session';

function resolvePlanPayload(snapshotPayload: unknown | null): PlanPayload {
  if (!snapshotPayload) return DEFAULT_PLAN;
  try {
    return parsePlanFromJson(snapshotPayload);
  } catch {
    return DEFAULT_PLAN;
  }
}

export default async function ProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ phase?: string }>;
}) {
  const { slug } = await params;
  const { phase: phaseParam } = await searchParams;
  const userId = await requireSessionUserId();
  const project = await getProjectForUser(slug, userId);
  if (!project) {
    notFound();
  }

  const phases = await prisma.phase.findMany({
    where: { projectId: project.id },
    orderBy: { sortOrder: 'asc' },
  });

  let activePhaseId: string | null = null;
  if (phaseParam) {
    const match = phases.find((p) => p.id === phaseParam);
    if (match) {
      activePhaseId = match.id;
    }
  }

  const [messages, snapshot] = await Promise.all([
    prisma.message.findMany({
      where: { projectId: project.id, phaseId: activePhaseId },
      orderBy: { createdAt: 'asc' },
      take: 100,
    }),
    prisma.planSnapshot.findFirst({
      where: { projectId: project.id, phaseId: activePhaseId },
      orderBy: { updatedAt: 'desc' },
    }),
  ]);

  const plan = resolvePlanPayload(snapshot?.payload ?? null);

  const envDefaultModel = getEnvDefaultChatModel();
  const effectiveChatModel = getEffectiveChatModel(project);

  const exportMd = activePhaseId
    ? `/api/projects/${project.slug}/export?format=md&phase=${activePhaseId}`
    : `/api/projects/${project.slug}/export?format=md`;
  const exportYaml = activePhaseId
    ? `/api/projects/${project.slug}/export?format=yaml&phase=${activePhaseId}`
    : `/api/projects/${project.slug}/export?format=yaml`;

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-2">
        <Link className="text-sm text-slate-600 hover:text-slate-900" href="/app">
          ← All projects
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
        <p className="text-sm text-slate-600">
          Chat refines the plan; export Markdown or YAML anytime. Sync uses server{' '}
          <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">Webhook_URL</code> plus the
          Bitrix ids below.
        </p>
      </div>

      <PhaseSection
        activePhaseId={activePhaseId}
        phases={phases}
        projectId={project.id}
        projectSlug={project.slug}
      />

      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">AI model</h2>
        <p className="mt-1 text-sm text-slate-600">
          Override the OpenAI chat model for this project, or use the value from{' '}
          <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">OPENAI_CHAT_MODEL</code>.
        </p>
        <div className="mt-4">
          <ChatModelForm envDefaultLabel={envDefaultModel} project={project} />
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Bitrix settings</h2>
        <p className="mt-1 text-sm text-slate-600">
          Stored per project; webhook stays in deployment secrets.
        </p>
        <div className="mt-4">
          <BitrixSettingsForm project={project} />
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Export</h2>
        <p className="mt-1 text-sm text-slate-600">Download the latest saved plan for this phase.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <a className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-800 hover:bg-slate-50" href={exportMd}>
            Download Markdown
          </a>
          <a
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-800 hover:bg-slate-50"
            href={exportYaml}
          >
            Download YAML
          </a>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Bitrix sync</h2>
        <p className="mt-1 text-sm text-slate-600">
          Dry-run logs intent; real sync creates tasks via the incoming webhook for the active phase
          plan.
        </p>
        <div className="mt-4">
          <SyncToolbar phaseId={activePhaseId} projectId={project.id} />
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">AI chat</h2>
        <div className="mt-4 flex flex-col gap-4">
          <ul className="max-h-80 space-y-3 overflow-y-auto rounded-md border border-slate-100 bg-slate-50 p-4 text-sm">
            {messages.length === 0 ? (
              <li className="text-slate-600">No messages yet. Start by describing the initiative.</li>
            ) : (
              messages.map((m) => (
                <li key={m.id}>
                  <span className="font-medium text-slate-800">
                    {m.role === 'user' ? 'You' : 'Assistant'}:
                  </span>{' '}
                  <span className="whitespace-pre-wrap text-slate-700">{m.content}</span>
                </li>
              ))
            )}
          </ul>
          <ChatPanel
            activeModel={effectiveChatModel}
            phaseId={activePhaseId}
            projectId={project.id}
          />
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <PlanEditor initialPlan={plan} phaseId={activePhaseId} projectId={project.id} />
      </section>
    </div>
  );
}
