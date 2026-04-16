import type { Adapter } from 'next-auth/adapters';
import { PrismaAdapter } from '@auth/prisma-adapter';
import type { PrismaClient } from '@prisma/client';

/**
 * Wraps the official Prisma adapter so `deleteSession` never throws P2025 when the row
 * is already gone (double magic-link open, race, stale cookie). Matches `useVerificationToken`
 * handling in the same upstream package.
 */
export function createAuthPrismaAdapter(prisma: PrismaClient): Adapter {
  const base = PrismaAdapter(prisma);
  return {
    ...base,
    deleteSession: async (sessionToken: string) => {
      await prisma.session.deleteMany({ where: { sessionToken } });
    },
  };
}
