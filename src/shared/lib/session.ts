import { cache } from 'react';
import { AccessStatus } from '@prisma/client';
import { auth as authRaw } from '@/auth';
import { redirect } from 'next/navigation';

/**
 * Per-request cached `auth()`. Use this in Server Components, layouts, pages,
 * route handlers and server actions so that a single RSC tree resolves the
 * session (and its `user.findUnique` callback) at most once per request.
 */
export const getSession = cache(authRaw);

/** Header / rail: short label for the signed-in user. */
export function accountDisplayLabel(user: {
  name?: string | null;
  email?: string | null;
} | null | undefined): string {
  if (!user) return 'Account';
  return user.name?.trim() || user.email?.split('@')[0]?.trim() || 'Account';
}

export async function requireActiveUserId(): Promise<string> {
  const session = await getSession();
  const id = session?.user?.id;
  if (!id) {
    redirect('/auth/signin');
  }
  if (session.user.accessStatus !== AccessStatus.ACTIVE) {
    redirect('/app/pending');
  }
  return id;
}

/** For Route Handlers: returns JSON Response when not allowed. */
export async function requireActiveUserForApi(): Promise<
  { userId: string } | { error: Response }
> {
  const session = await getSession();
  const userId = session?.user?.id;
  if (!userId) {
    return { error: Response.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  if (session.user.accessStatus !== AccessStatus.ACTIVE) {
    return { error: Response.json({ error: 'Forbidden' }, { status: 403 }) };
  }
  return { userId };
}
