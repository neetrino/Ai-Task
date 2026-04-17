import Link from 'next/link';
import { redirect } from 'next/navigation';
import { parseAccountTab } from '@/features/account/account-tab';
import { AccountProfilePanel } from '@/features/account/AccountProfilePanel';
import { AccountSettingsBlocks } from '@/features/account/AccountSettingsBlocks';
import { AccountSidebar } from '@/features/account/AccountSidebar';
import { loadBudgetSnapshot } from '@/features/billing/token-budget';
import { listProjectsWithPhasesForAccount } from '@/features/projects/project-queries';
import { DEFAULT_PLAN, parsePlanFromJson, type PlanPayload } from '@/shared/domain/plan';
import { prisma } from '@/shared/lib/prisma';
import { getSession, requireActiveUserId } from '@/shared/lib/session';
import { AppMainConstrained } from '@/shared/ui/AppMainConstrained';
import {
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
  searchParams: Promise<{ project?: string; phase?: string; tab?: string }>;
}) {
  const sp = await searchParams;
  if (typeof sp.project === 'string' || typeof sp.phase === 'string') {
    redirect('/app/account');
  }

  const activeTab = parseAccountTab(
    typeof sp.tab === 'string' ? sp.tab : undefined,
  );

  const userId = await requireActiveUserId();
  const session = await getSession();
  const projects = await listProjectsWithPhasesForAccount(userId);

  const email = session?.user?.email ?? session?.user?.id ?? 'Account';
  const name = session?.user?.name;
  const imageUrl = session?.user?.image;

  if (projects.length === 0) {
    return (
      <AppMainConstrained>
        <div className="mx-auto w-full max-w-5xl">
          <header className="mb-8 border-b border-white/10 pb-6">
            <Link className={WORKSPACE_LINK_CLASS} href="/app">
              ← All projects
            </Link>
            <h1 className="mt-4 text-2xl font-semibold tracking-tight text-white">Account</h1>
            <p className={`mt-2 max-w-prose ${WORKSPACE_BODY_CLASS}`}>
              Manage your profile and preferences.
            </p>
          </header>

          <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
            <AccountSidebar
              activeTab={activeTab}
              email={email}
              imageUrl={imageUrl}
              name={name}
            />
            <div className="min-w-0 flex-1">
              {activeTab === 'profile' ? (
                <AccountProfilePanel email={email} name={name} />
              ) : (
                <section className={`${WORKSPACE_PANEL_CLASS} p-5 sm:p-6`}>
                  <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                    Preferences
                  </h2>
                  <p className={`${WORKSPACE_BODY_CLASS} text-sm`}>
                    Create a project first — then you can set the AI model and plan JSON here.
                  </p>
                </section>
              )}
            </div>
          </div>
        </div>
      </AppMainConstrained>
    );
  }

  const activeProject = projects[0];
  const activePhaseId =
    activeProject.phases.length > 0 ? activeProject.phases[0].id : null;

  const [snapshot, budget] = await Promise.all([
    prisma.planSnapshot.findFirst({
      where: { projectId: activeProject.id, phaseId: activePhaseId },
      orderBy: { updatedAt: 'desc' },
    }),
    loadBudgetSnapshot({ userId, projectId: activeProject.id }),
  ]);
  const plan = resolvePlanPayload(snapshot?.payload ?? null);

  const settingsKey = `${activeProject.id}-${activePhaseId ?? 'none'}`;

  return (
    <AppMainConstrained>
      <div className="mx-auto w-full max-w-5xl">
        <header className="mb-8 border-b border-white/10 pb-6">
          <Link className={WORKSPACE_LINK_CLASS} href="/app">
            ← All projects
          </Link>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-white">Account</h1>
          <p className={`mt-2 max-w-prose ${WORKSPACE_BODY_CLASS}`}>
            Manage your profile and workspace preferences.
          </p>
        </header>

        <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
          <AccountSidebar
            activeTab={activeTab}
            email={email}
            imageUrl={imageUrl}
            name={name}
          />

          <div className="min-w-0 flex-1">
            {activeTab === 'profile' ? (
              <AccountProfilePanel email={email} name={name} />
            ) : (
              <section className={`${WORKSPACE_PANEL_CLASS} p-5 sm:p-6`}>
                <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Preferences
                </h2>
                <p className={`mb-6 max-w-prose ${WORKSPACE_BODY_CLASS} text-sm`}>
                  AI model and plan apply to{' '}
                  <span className="text-neutral-300">{activeProject.name}</span>
                  {activePhaseId ? (
                    <>
                      {', phase '}
                      <span className="text-neutral-300">
                        {activeProject.phases[0]?.label ?? '—'}
                      </span>
                    </>
                  ) : null}
                  . The plan JSON editor loads only when you expand it.
                </p>
                <AccountSettingsBlocks
                  key={settingsKey}
                  activePhaseId={activePhaseId}
                  budget={budget}
                  plan={plan}
                  project={{
                    id: activeProject.id,
                    modelPreset: activeProject.modelPreset,
                    pinnedModelId: activeProject.pinnedModelId,
                  }}
                />
              </section>
            )}
          </div>
        </div>
      </div>
    </AppMainConstrained>
  );
}
