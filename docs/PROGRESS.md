# Development progress — PlanRelay / Bitrix24-Task

**Project.** PlanRelay (web) + Bitrix24 sync CLI  
**Phase.** Documentation / architecture  
**Overall progress.** 8% (docs, stack, `.env.example`; app not scaffolded)

**Last updated.** 2026-04-14

---

## Phases

| Phase | Status | Progress |
|-------|--------|----------|
| 1. Init & docs | In progress | 85% |
| 2. Next.js + Prisma + Auth.js + Neon | Not started | 0% |
| 3. Core features (projects, chat, plan) | Not started | 0% |
| 4. Export MD + Bitrix sync integration | Not started | 0% |
| 5. Hardening & E2E | Not started | 0% |
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
- [x] CLI sync script and `plans/example.plan.yaml` (pre-existing)

---

## In progress

- [x] Extend `.env.example` for web (Neon, Auth.js)
- [x] Root `README.md` — link web docs + CLI section
- [ ] Scaffold Next.js app (`pnpm`, Prisma, Auth.js) — **not started**

---

## Blocked / waiting

- Neon `DATABASE_URL` and Vercel project (developer-provided)
- OAuth / magic-link provider choice (see `docs/TECH_CARD.md` §5)
- Adaptive DB limits (pool, timeouts) — team alignment per `00-core.mdc`

---

## Notes

Update this file when milestones complete; keep percentages honest.
