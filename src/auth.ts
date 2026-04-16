import { AccessStatus } from '@prisma/client';
import NextAuth from 'next-auth';
import Email from 'next-auth/providers/email';
import { Resend } from 'resend';
import { createAuthPrismaAdapter } from '@/features/auth/prisma-auth-adapter';
import { buildMagicLinkEmailContent } from '@/features/auth/magic-link-email-html';
import { prisma } from '@/shared/lib/prisma';
import { logger } from '@/shared/lib/logger';

const fromFallback = 'Aibonacci.am <onboarding@resend.dev>';

const SECONDS_PER_DAY = 86_400;
const SESSION_MAX_AGE_SECONDS = 30 * SECONDS_PER_DAY;
/** Refresh session timestamp in the DB at most every 24h (Auth.js default pattern). */
const SESSION_UPDATE_AGE_SECONDS = SECONDS_PER_DAY;

const isProduction = process.env.NODE_ENV === 'production';

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: process.env.AUTH_TRUST_HOST === 'true' || process.env.VERCEL === '1',
  adapter: createAuthPrismaAdapter(prisma),
  useSecureCookies: isProduction,
  session: {
    strategy: 'database',
    maxAge: SESSION_MAX_AGE_SECONDS,
    updateAge: SESSION_UPDATE_AGE_SECONDS,
  },
  cookies: {
    sessionToken: {
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: isProduction,
      },
    },
  },
  pages: {
    signIn: '/auth/signin',
    verifyRequest: '/auth/verify',
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        const row = await prisma.user.findUnique({
          where: { id: user.id },
          select: { accessStatus: true },
        });
        session.user.accessStatus = row?.accessStatus ?? AccessStatus.PENDING;
      }
      return session;
    },
  },
  providers: [
    Email({
      // Required by the Email provider (Nodemailer wiring); actual delivery uses Resend below.
      server: {
        host: 'localhost',
        port: 587,
        auth: { user: 'unused', pass: 'unused' },
      },
      from: process.env.RESEND_FROM_EMAIL ?? fromFallback,
      sendVerificationRequest: async ({ identifier, url, provider }) => {
        const apiKey = process.env.RESEND_API_KEY;
        if (!apiKey) {
          logger.info({ email: identifier, url }, 'Magic link (dev — set RESEND_API_KEY to send email)');
          return;
        }
        const resend = new Resend(apiKey);
        const from = typeof provider.from === 'string' ? provider.from : fromFallback;
        const { subject, html, text } = buildMagicLinkEmailContent(url);
        const { error } = await resend.emails.send({
          from,
          to: identifier,
          subject,
          html,
          text,
        });
        if (error) {
          logger.error({ err: error, email: identifier }, 'Resend send failed');
          throw new Error(error.message);
        }
      },
    }),
  ],
});
