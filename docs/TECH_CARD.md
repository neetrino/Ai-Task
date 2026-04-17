# Technology card — Aibonacci (Bitrix24 planning web)

**Project.** Aibonacci — AI-assisted planning, YAML/Markdown export, Bitrix24 sync  
**Size.** B (medium)  
**Date.** 2026-04-14  
**Status.** draft — pending team confirmation on adaptive DB limits (pool, timeouts)

> Fill sections 1–11 before implementation; mark status **approved** after sign-off. Section 12 at release.

---

## 1. Foundation

| # | Parameter | Decision | Status | Notes |
|---|-----------|----------|--------|-------|
| 1.1 | Project size | B | ✅ | 3–6 mo, feature-based layout |
| 1.2 | Architecture | Feature-based monolith (Next.js App Router) | ✅ | No separate NestJS for v1 |
| 1.3 | Package manager | pnpm | ⬜ | Align when web app is added to repo |
| 1.4 | Node.js | 22.x LTS (or Active LTS at deploy time) | ⬜ | Match Vercel runtime |
| 1.5 | TypeScript | 5.7+, `strict: true` | ✅ | |
| 1.6 | Monorepo tool | — (single app) | ✅ | C would use Turborepo |
| 1.7 | Git strategy | trunk-based + short-lived feature branches | ⬜ | |
| 1.8 | Commit convention | Conventional Commits (existing commitlint) | ✅ | |

---

## 2. Frontend

| # | Parameter | Decision | Status | Notes |
|---|-----------|----------|--------|-------|
| 2.1 | Framework | Next.js (App Router), React | ⬜ | Deploy on Vercel |
| 2.2 | Styles | Tailwind CSS | ⬜ | No inline styles (project rules) |
| 2.3 | UI kit | shadcn/ui (Radix) | ⬜ | Minimal modern UI |
| 2.4 | State | Server Components first; Zustand or React context for client-only UI state | ⬜ | |
| 2.5 | Forms | React Hook Form + Zod | ⬜ | |
| 2.6 | Data fetching | Server Components + server actions; TanStack Query optional for chat | ⬜ | |
| 2.7 | i18n | None for v1 (EN UI) | ⬜ | Russian copy optional later |
| 2.8 | SEO | Minimal (app behind login) | ⬜ | |
| 2.9 | Dark mode | Optional (CSS variables) | ⬜ | Decide with UI pass |
| 2.10 | Animations | CSS transitions only unless needed | ⬜ | |
| 2.11 | PWA | No for v1 | ⬜ | |

---

## 3. Backend

| # | Parameter | Decision | Status | Notes |
|---|-----------|----------|--------|-------|
| 3.1 | Type | Next.js Route Handlers + Server Actions | ✅ | Same deploy unit as frontend |
| 3.2 | Validation | Zod at all boundaries | ✅ | |
| 3.3 | API format | REST + server actions (no GraphQL v1) | ✅ | |
| 3.4 | Rate limiting | Middleware (e.g. Upstash Ratelimit) or Vercel-friendly limiter | ⬜ | **Adaptive — align** |
| 3.5 | API documentation | OpenAPI optional; internal MD in `docs/` | ⬜ | |
| 3.6 | CRON | Only if needed (e.g. cleanup); Vercel Cron | ⬜ | |
| 3.7 | File upload | Project chat attachments via `multipart/form-data`; whitelist `.md/.txt/.json/.yaml/.yml`; size cap 1 MB; UTF-8 sniff; injected into LLM context per message | ✅ | Stored in Cloudflare R2 (see §6.1) |

---

## 4. Database

| # | Parameter | Decision | Status | Notes |
|---|-----------|----------|--------|-------|
| 4.1 | DBMS | PostgreSQL (Neon) | ✅ | `DATABASE_URL` from Neon |
| 4.2 | ORM | Prisma | ✅ | Prisma 6/7 per install time |
| 4.3 | DB roles | Neon connection string (least privilege) | ⬜ | No superuser in app |
| 4.4 | Connection limit | Neon pooler; **adaptive — align with team** | ⬜ | |
| 4.5 | `statement_timeout` | **Adaptive — align** | ⬜ | Set in Neon or Prisma |
| 4.6 | `idle_in_transaction_session_timeout` | **Adaptive — align** | ⬜ | |
| 4.7 | `lock_timeout` | **Adaptive — align** | ⬜ | |
| 4.8 | Seed | `prisma db seed` for dev | ⬜ | |
| 4.9 | Cache (Redis) | Optional Upstash later | ⬜ | Not required for v1 |
| 4.10 | Queues | None for v1 | ⬜ | Sync runs in request or short job |

---

## 5. Authentication

| # | Parameter | Decision | Status | Notes |
|---|-----------|----------|--------|-------|
| 5.1 | Solution | Auth.js (NextAuth v5) | ✅ | |
| 5.2 | Providers | Email magic link + Google (optional) | ⬜ | **Confirm providers** |
| 5.3 | Sessions | Database sessions via Prisma adapter | ✅ | |
| 5.4 | Access control | `User.accessStatus`: `PENDING` (default) / `ACTIVE` (set in DB); app + APIs require `ACTIVE` | ✅ | |
| 5.5 | Email verification | As required by provider | ⬜ | Resend if magic link |
| 5.6 | Password reset | N/A if passwordless only | ⬜ | |

---

## 6. Storage and CDN

| # | Parameter | Decision | Status | Notes |
|---|-----------|----------|--------|-------|
| 6.1 | Object storage | Cloudflare R2 (S3-compatible) for chat attachments. Env: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`. Key scheme: `projects/<projectId>/attachments/<attachmentId>/<safeFilename>` | ✅ | Use a separate bucket per environment |
| 6.2 | CDN | Vercel | ✅ | |
| 6.3 | Images | `next/image` if needed | ⬜ | |

---

## 7. External services

| # | Parameter | Decision | Status | Notes |
|---|-----------|----------|--------|-------|
| 7.1 | Email | Resend (if magic link) | ⬜ | |
| 7.2 | Payments | None | ✅ | |
| 7.3 | Analytics | Vercel Analytics optional | ⬜ | |
| 7.4 | Error tracking | Sentry optional | ⬜ | |
| 7.5 | Search | None v1 | ✅ | |
| 7.6 | Push / WebSocket | None v1 (polling or SSE optional later) | ⬜ | |
| 7.7 | SMS | None | ✅ | |
| 7.8 | AI | OpenAI API (server-only); optional Vercel AI SDK | ✅ | Key in env |
| 7.9 | CMS | None | ✅ | |
| 7.10 | Bitrix24 | Incoming webhook REST (`Webhook_URL`); plan schema `src/shared/domain/plan.ts` | ✅ | |

---

## 8. DevOps and hosting

| # | Parameter | Decision | Status | Notes |
|---|-----------|----------|--------|-------|
| 8.1 | App hosting | Vercel | ✅ | |
| 8.2 | Separate backend host | None | ✅ | |
| 8.3 | CI/CD | GitHub Actions | ⬜ | Lint, test, build |
| 8.4 | Docker | Optional for local DB only | ⬜ | |
| 8.5 | WAF | Cloudflare optional | ⬜ | |
| 8.6 | Logging | `pino` or structured logger in prod | ⬜ | No `console.log` in prod paths |
| 8.7 | Environments | dev + preview + production | ✅ | Neon branches |
| 8.8 | Domain | Custom on Vercel | ⬜ | Affects `AUTH_URL` |
| 8.9 | DB backups | Neon PITR | ✅ | |

---

## 9. Testing

| # | Parameter | Decision | Status | Notes |
|---|-----------|----------|--------|-------|
| 9.1 | Unit tests | Vitest | ⬜ | Domain + utils |
| 9.2 | Component tests | React Testing Library selective | ⬜ | |
| 9.3 | E2E | Playwright critical paths | ⬜ | Login, project, export |
| 9.4 | Coverage target | **Adaptive — align** (e.g. ≥70% core) | ⬜ | |
| 9.5 | API tests | Route handler integration tests | ⬜ | |

---

## 10. Security (mandatory)

| # | Parameter | Status | Notes |
|---|-----------|--------|-------|
| 10.1 | CORS | ⬜ | Restrict to app origin |
| 10.2 | CSRF | ⬜ | Server actions / same-site cookies |
| 10.3 | Helmet | ➖ | Next.js defaults |
| 10.4 | Input validation (Zod) | ⬜ | |
| 10.5 | argon2 | ➖ | If credentials auth added |
| 10.6 | Rate limiting | ⬜ | AI and auth endpoints |
| 10.7 | Secrets in env only | ⬜ | Never webhook/OpenAI in client |

---

## 11. Documentation

| # | Document | Status | Notes |
|---|----------|--------|-------|
| 11.1 | `docs/BRIEF.md` | ✅ | Product brief |
| 11.2 | `docs/TECH_CARD.md` | 🔄 | This file |
| 11.3 | `docs/01-ARCHITECTURE.md` | ✅ | |
| 11.4 | `docs/02-TECH_SPEC.md` | ✅ | Functional + technical spec |
| 11.5 | `docs/PROGRESS.md` | ✅ | |
| 11.6 | `README.md` | ✅ | Root readme + Aibonacci links |
| 11.7 | `.env.example` | ✅ | Neon, Auth.js, Bitrix, OpenAI |
| 11.8 | `docs/DECISIONS.md` | ✅ | ADR-001…003 |

---

## 12. Final checklist (at release)

Not filled until release — see template `docs/reference/templates/TECH_CARD_TEMPLATE.md` section 12.

---

## Summary

**Confirmed stack:** Neon (PostgreSQL) + Prisma + Auth.js + Next.js on Vercel + OpenAI (server) + Bitrix sync (web app).

**Discuss with team:** OAuth providers, rate limits, DB timeouts, pnpm migration timing, email provider for magic link.
