import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AccessStatus } from '@prisma/client';
import { auth } from '@/auth';
import { signOutAction } from '@/features/auth/auth-actions';
import {
  WORKSPACE_ACCENT_BTN_CLASS,
  WORKSPACE_BODY_CLASS,
  WORKSPACE_GHOST_BTN_CLASS,
  WORKSPACE_H2_CLASS,
  WORKSPACE_PANEL_CLASS,
} from '@/shared/ui/workspace-ui';

export default async function PendingAccessPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/auth/signin');
  }
  if (session.user.accessStatus === AccessStatus.ACTIVE) {
    redirect('/app');
  }

  return (
    <div className={`mx-auto max-w-lg p-8 ${WORKSPACE_PANEL_CLASS}`}>
      <h1 className={`${WORKSPACE_H2_CLASS} text-xl`}>Access pending</h1>
      <p className={`mt-3 leading-relaxed ${WORKSPACE_BODY_CLASS}`}>
        Your sign-in is saved. An administrator must approve your account before you can use projects
        and planning. You will have full access after your status is set to active in the database.
      </p>
      <p className={`mt-4 ${WORKSPACE_BODY_CLASS}`}>
        Signed in as{' '}
        <span className="font-medium text-slate-200">{session.user.email ?? session.user.id}</span>
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link className={WORKSPACE_GHOST_BTN_CLASS} href="/">
          Home
        </Link>
        <form action={signOutAction}>
          <button className={WORKSPACE_ACCENT_BTN_CLASS} type="submit">
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
