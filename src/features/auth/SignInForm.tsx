'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { signInWithEmail } from '@/features/auth/auth-actions';
import { AUTH_PRIMARY_CTA_FORM_CLASS } from '@/shared/ui/auth-cta-classes';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className={AUTH_PRIMARY_CTA_FORM_CLASS} disabled={pending} type="submit">
      {pending ? 'Sending link…' : 'Continue with email'}
    </button>
  );
}

export function SignInForm() {
  const [state, formAction] = useActionState(signInWithEmail, undefined);
  return (
    <form action={formAction} className="flex w-full flex-col gap-4">
      <label className="flex flex-col gap-2 text-sm font-medium text-slate-200" htmlFor="email">
        Email
        <input
          className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:border-violet-400/60 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
          id="email"
          name="email"
          placeholder="you@company.com"
          required
          type="email"
          autoComplete="email"
        />
      </label>
      {state?.error ? <p className="text-sm text-red-400">{state.error}</p> : null}
      <SubmitButton />
    </form>
  );
}
