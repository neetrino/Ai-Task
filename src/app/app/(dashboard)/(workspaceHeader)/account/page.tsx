import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AccountContextPicker } from '@/features/account/AccountContextPicker';
import { AccountSettingsBlocks } from '@/features/account/AccountSettingsBlocks';
import { accountSettingsPath } from '@/features/account/account-settings-path';
import { signOutAction } from '@/features/auth/auth-actions';
import { listProjectsWithPhasesForAccount } from '@/features/projects/project-queries';
import { DEFAULT_PLAN, parsePlanFromJson, type PlanPayload } from '@/shared/domain/plan';
import { prisma } from '@/shared/lib/prisma';
import { getSession, requireActiveUserId } from '@/shared/lib/session';
import { AppMainConstrained } from '@/shared/ui/AppMainConstrained';
import {
  WORKSPACE_ACCENT_BTN_CLASS,
  WORKSPACE_BODY_CLASS,
  WORKSPACE_LINK_CLASS,
  WORKSPACE_PANEL_CLASS,
} from '@/shared/ui/workspace-ui';

function resolvePlanPayload(snapshotPayload: unknown | null): PlanPayload {
  if (!snapshotPayload) return DEFAULT_PLAN;
  try {
    return parsePlanFromJson(snapshotPayload);
  } catch {
    return DEFAULT_PLAN;
  }
}

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string; phase?: string }>;
}) {
  const userId = await requireActiveUserId();
  const session = await getSession();
  const sp = await searchParams;
  const projects = await listProjectsWithPhasesForAccount(userId);

  const projectParam = typeof sp.project === 'string' ? sp.project : undefined;
  const phaseParam = typeof sp.phase === 'string' ? sp.phase : undefined;

  const email = session?.user?.email ?? session?.user?.id ?? 'Account';

  if (projects.length === 0) {
    return (
      <AppMainConstrained>
        <div className="mx-auto flex max-w-lg flex-col gap-8">
          <header className="flex flex-col gap-2">
            <Link className={WORKSPACE_LINK_CLASS} href="/app">
              ← All projects
            </Link>
            <h1 className="text-2xl font-semibold tracking-tight text-white">My account</h1>
            <p className={`${WORKSPACE_BODY_CLASS} text-sm`}>
              Signed in as <span className="font-medium text-slate-200">{email}</span>
            </p>
            <p className={`${WORKSPACE_BODY_CLASS} text-sm`}>
              Create a project first — then you can set the AI model and edit plan JSON here.
            </p>
          </header>
          <div className={`${WORKSPACE_PANEL_CLASS} flex flex-col gap-4 p-6`}>
            <form action={signOutAction}>
              <button className={WORKSPACE_ACCENT_BTN_CLASS} type="submit">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </AppMainConstrained>
    );
  }

  const matched =
    projectParam !== undefined ? projects.find((p) => p.slug === projectParam) : undefined;
  const activeProject = matched ?? projects[0];

  let activePhaseId: string | null = phaseParam ?? null;
  if (activeProject.phases.length > 0) {
    if (!activePhaseId || !activeProject.phases.some((ph) => ph.id === activePhaseId)) {
      activePhaseId = activeProject.phases[0].id;
    }
  } else {
    activePhaseId = null;
  }

  const canonical = accountSettingsPath(activeProject.slug, activePhaseId);
  const currentProjectOk = projectParam === activeProject.slug;
  const currentPhaseOk = phaseParam === (activePhaseId ?? undefined);
  if (!currentProjectOk || !currentPhaseOk) {
    redirect(canonical);
  }

  const snapshot = await prisma.planSnapshot.findFirst({
    where: { projectId: activeProject.id, phaseId: activePhaseId },
    orderBy: { updatedAt: 'desc' },
  });
  const plan = resolvePlanPayload(snapshot?.payload ?? null);

  return (
    <AppMainConstrained>
      <div className="mx-auto flex max-w-3xl flex-col gap-8">
        <header className="flex flex-col gap-2">
          <Link className={WORKSPACE_LINK_CLASS} href="/app">
            ← All projects
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight text-white">My account</h1>
          <p className={`${WORKSPACE_BODY_CLASS} text-sm`}>
            Signed in as <span className="font-medium text-slate-200">{email}</span>
          </p>
          <p className={`${WORKSPACE_BODY_CLASS} text-sm`}>
            AI model and plan JSON apply to the selected project and phase.
          </p>
        </header>

        <div className={`${WORKSPACE_PANEL_CLASS} flex flex-col gap-6 p-6`}>
          <AccountContextPicker
            activePhaseId={activePhaseId}
            activeProjectSlug={activeProject.slug}
            projects={projects}
          />
          <AccountSettingsBlocks
            activePhaseId={activePhaseId}
            plan={plan}
            project={{
              id: activeProject.id,
              openaiChatModel: activeProject.openaiChatModel,
            }}
          />
          <form action={signOutAction}>
            <button className={WORKSPACE_ACCENT_BTN_CLASS} type="submit">
              Sign out
            </button>
          </form>
        </div>
      </div>
    </AppMainConstrained>
  );
}
