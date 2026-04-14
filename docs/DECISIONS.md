# Architecture decisions — PlanRelay

**Format.** Short ADR-style entries.  
**Last updated.** 2026-04-14

---

## ADR-001 — Stack: Neon + Prisma + Auth.js + Next.js on Vercel

**Status.** Accepted  
**Date.** 2026-04-14

**Context.** Need a team-wide hosted app with accounts, persistent projects/chat, and secure secrets for Bitrix webhook and OpenAI.

**Decision.**

- **Neon** for managed PostgreSQL (serverless-friendly, branches for preview).
- **Prisma** as ORM (Type-safe, migrations, fits Cursor project rules).
- **Auth.js** for authentication (same runtime as Next.js; database sessions).
- **Next.js** (App Router) as a single deployable unit on **Vercel**.

**Consequences.**

- Positive: one repo, one deploy, straightforward local dev with Neon dev branch.
- Negative: long-running background jobs are limited; Bitrix sync must complete within serverless timeouts or be split later.

---

## ADR-002 — Project size B, feature-based layout

**Status.** Accepted  
**Date.** 2026-04-14

**Context.** Feature set spans auth, projects, AI chat, plan editing, export, and Bitrix integration.

**Decision.** Declare **size B**: `src/features/*`, `src/shared/*`, public barrels, no `shared` importing `features`.

**Consequences.** Slightly more structure upfront; easier scaling than flat `components/` only.

---

## ADR-003 — Webhook and OpenAI keys only in environment

**Status.** Accepted  
**Date.** 2026-04-14

**Context.** Webhook URLs are sensitive; OpenAI keys must not leak to browsers.

**Decision.** Store `Webhook_URL` and `OpenAI_API_Key` / `OPENAI_API_KEY` only in deployment environment and server-side code. Per-project **Bitrix numeric IDs** (`Bitrix24_Project_id`, `Task_owner_id`, `Task_Assignee_id`) live in the database.

**Consequences.** Dashboard edits IDs, not webhook; CLI users keep using `.env` as today.
