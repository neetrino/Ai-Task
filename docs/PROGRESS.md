# Development progress — PlanRelay / Bitrix24-Task

**Project.** PlanRelay (web)  
**Phase.** Core web app + integrations  
**Overall progress.** ~65% (MVP scaffolded; production hardening ongoing)

**Last updated.** 2026-04-14

---

## Phases

| Phase | Status | Progress |
|-------|--------|----------|
| 1. Init & docs | Done | 95% |
| 2. Next.js + Prisma + Auth.js + Neon | Done | 90% |
| 3. Core features (projects, chat, plan) | Done | 85% |
| 4. Export MD + Bitrix sync integration | Done | 85% |
| 5. Hardening & E2E | In progress | 40% |
| 6. Production deploy | Not started | 0% |

---

## Done

### Phase 1

- [x] Project size set to **B** (feature-based) in `.cursor/rules/00-core.mdc`
- [x] `docs/TECH_CARD.md` — stack: Neon, Prisma, Auth.js, Next.js, Vercel
- [x] `docs/01-ARCHITECTURE.md` — system architecture
- [x] `docs/02-TECH_SPEC.md` — functional/technical specification
- [x] `docs/BRIEF.md` — product brief
- [x] `docs/DECISIONS.md` — ADRs
- [x] Plan schema (`src/shared/domain/plan.ts`)

### Phase 2–4 (implementation)

- [x] pnpm + Next.js App Router + Tailwind + strict TypeScript
- [x] Prisma schema (Auth.js tables, Project, Phase, Message, PlanSnapshot), migrations
- [x] Auth.js email magic link (Resend when configured; dev log otherwise)
- [x] Protected `/app` layout (server-side `auth()`)
- [x] Projects CRUD (create + Bitrix field settings)
- [x] Phases: list, create, scope chat/plan/export/sync by `?phase=`
- [x] AI chat + validated plan JSON + snapshots (OpenAI server-side)
- [x] Plan editor (JSON) + Markdown/YAML export routes
- [x] Bitrix sync (dry-run + live) via `src/server/bitrix/*` from the web app
- [x] Optional Upstash rate limit for chat/sync (`UPSTASH_*`)
- [x] Vitest unit test, Playwright smoke, GitHub Actions CI

---

## In progress

- [ ] Broader Playwright coverage (login, project flows) — needs test mail or provider mock
- [ ] Production deploy checklist (Vercel env, Neon, Resend domain)

---

## Blocked / waiting

- OAuth / Google (optional; see `docs/TECH_CARD.md` §5)
- Adaptive DB limits (pool, timeouts) — team alignment per `00-core.mdc`

---

## Notes

Update this file when milestones complete; keep percentages honest.
