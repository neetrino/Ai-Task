'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { signInWithEmail } from '@/features/auth/auth-actions';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
      disabled={pending}
      type="submit"
    >
      {pending ? 'Sending link…' : 'Continue with email'}
    </button>
  );
}

export function SignInForm() {
  const [state, formAction] = useActionState(signInWithEmail, undefined);
  return (
    <form action={formAction} className="flex max-w-md flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm font-medium text-slate-700" htmlFor="email">
        Email
        <input
          className="rounded-md border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
          id="email"
          name="email"
          placeholder="you@company.com"
          required
          type="email"
        />
      </label>
      {state?.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      <SubmitButton />
    </form>
  );
}
