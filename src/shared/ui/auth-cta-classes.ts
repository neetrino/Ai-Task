/** Shared primary auth / entry CTA — light pill on dark, cyan glow (distinct from violet body). */
const AUTH_PRIMARY_CTA_BASE =
  'inline-flex items-center justify-center gap-2 rounded-full border border-cyan-300/55 bg-gradient-to-b from-white to-slate-100 font-semibold text-slate-900 shadow-[0_0_36px_-10px_rgba(34,211,238,0.45)] transition hover:border-cyan-200/90 hover:from-slate-50 hover:to-white hover:shadow-[0_0_44px_-6px_rgba(34,211,238,0.55)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400 disabled:opacity-60';

/** Home hero — large, visually central. */
export const AUTH_PRIMARY_CTA_HERO_CLASS = `${AUTH_PRIMARY_CTA_BASE} px-10 py-4 text-base`;

/** Sign-in form submit — full width inside card. */
export const AUTH_PRIMARY_CTA_FORM_CLASS = `${AUTH_PRIMARY_CTA_BASE} w-full px-5 py-3.5 text-sm sm:text-base`;
