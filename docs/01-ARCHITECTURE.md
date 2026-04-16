# Architecture — PlanRelay

**Product.** PlanRelay — collaborative AI-assisted planning with Bitrix24 sync and developer-friendly Markdown export.  
**Project size.** B (medium), feature-based layout.  
**Last updated.** 2026-04-14

---

## 1. Overview

### Purpose

Replace ad-hoc chat + manual YAML editing with a **single web app**: authenticated users manage **projects** and **phases**, converse with AI to produce a structured plan (schema in `src/shared/domain/plan.ts`), edit tasks in the UI, export **Markdown** for developers, and trigger **Bitrix sync** using team secrets and per-project Bitrix IDs.

### Users

- **Team member** — signs in, creates/selects a project, chats, edits tasks, exports MD/YAML, runs sync when allowed.
- **Admin** (future) — optional; manage org-wide settings.

### Non-goals (v1)

- Public internet marketing site; billing; mobile native apps.

---

## 2. High-level architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                      Vercel (Next.js)                        │
│  ┌─────────────┐   ┌──────────────────┐   ┌────────────────┐ │
│  │ App Router  │   │ Route Handlers │   │ Server Actions │ │
│  │ (RSC + UI)  │   │ REST / AI      │   │ forms / sync   │ │
│  └──────┬──────┘   └────────┬───────┘   └───────┬────────┘ │
│         │                   │                    │          │
│         └───────────────────┼────────────────────┘          │
│                             ▼                               │
│                    ┌─────────────────┐                      │
│                    │ Domain services │                      │
│                    │ (features/*)    │                      │
│                    └────────┬────────┘                      │
└─────────────────────────────┼───────────────────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         ▼                    ▼                    ▼
┌─────────────┐    ┌─────────────────┐    ┌──────────────┐
│ Neon        │    │ OpenAI API      │    │ Bitrix24     │
│ PostgreSQL  │    │ (server-only) │    │ REST webhook │
└─────────────┘    └─────────────────┘    └──────────────┘
```

**Style.** Modular monolith: one deployable Next.js application. Dependencies flow **inward** (UI → application services → domain types; infrastructure implements ports).

---

## 3. Components

### Frontend (Next.js App Router)

- **Presentation:** React Server Components by default; client components for chat stream, task list interactions, file upload.
- **Styling:** Tailwind CSS; shared primitives under `src/shared/ui` (or equivalent).
- **Location:** `src/app/` routes; feature UI under `src/features/<feature>/`.

### Backend (same Next.js process)

- **Auth.js** — session in DB; middleware protects `/app/*` routes.
- **AI orchestration** — server-only calls to OpenAI; prompts enforce plan schema (`src/shared/domain/plan.ts`).
- **Bitrix sync** — `src/server/bitrix/*` invoked with `Webhook_URL` from env and per-project IDs from the database.

### Database (Neon + Prisma)

- **Users** — Auth.js Prisma adapter tables.
- **Workspace / Project** — project name, owner, foreign keys.
- **Project settings** — `bitrixProjectId`, `taskOwnerId`, `taskAssigneeId` (integers as strings or bigint per schema).
- **Phase** (iteration) — belongs to project; optional label (“Phase 2”).
- **Chat / messages** — linked to project and phase for history and “continue later”.
- **Plan snapshot** — JSON or structured representation of epics/tasks for edits and export.

Exact schema belongs in `prisma/schema.prisma` (to be added with implementation).

### Secrets (Vercel environment)

| Variable | Usage |
|----------|--------|
| `DATABASE_URL` | Neon pooled connection |
| `AUTH_SECRET` | Auth.js |
| `AUTH_URL` | Canonical app URL |
| `OPENAI_API_KEY` or `OpenAI_API_Key` | Align naming in `.env.example` |
| `Webhook_URL` | Bitrix incoming webhook (never exposed to browser) |

Per-project Bitrix IDs are **not** secrets; stored in DB.

---

## 4. Folder layout (target — Size B)

```text
src/
  app/                    # routes, layouts, route handlers
  features/
    auth/                 # sign-in UI wrappers if needed
    projects/             # project + phase CRUD
    chat/                 # AI chat UI + server integration
    plan-editor/          # task list, YAML/MD preview
    bitrix-sync/          # trigger sync, status
  shared/
    ui/                   # buttons, inputs (design system)
    lib/                  # logger, env, utils
    config/               # constants
  server/                 # optional: services only used on server
prisma/
  schema.prisma
```

**Rules:** `features/*` may import `shared/*`; `shared/*` must not import `features/*`. Cross-feature imports only through public barrels or shared contracts.

---

## 5. Data flows

### Chat → plan

1. User sends message (+ optional file text) → Server Action or Route Handler.
2. Validate input (Zod); load project context from DB.
3. Call OpenAI with system prompt (YAML schema).
4. Parse model output; validate against Zod plan schema; persist message + plan snapshot.

### Export Markdown

1. Read latest approved plan snapshot for project/phase.
2. Render MD string server-side (template).
3. Return `Content-Disposition: attachment` download.

### Sync to Bitrix

1. Load latest plan snapshot from DB (validated `Plan` / YAML-shaped JSON).
2. Resolve webhook from server env; project/group and task actors from project settings in DB.
3. Run `runSyncPlan` (dry-run optional); record result in DB or flash message.

---

## 6. Security

- **Webhook and OpenAI key** — server env only; never serialized to client.
- **Authorization** — every project-scoped query filters by `userId` / membership (add `ProjectMember` table when multi-user per project).
- **CSRF** — Auth.js + Next.js patterns for mutations.
- **Rate limits** — stricter on AI and sync endpoints.

---

## 7. Deployment

- **Production:** Vercel project linked to Git; Neon production branch.
- **Preview:** Vercel preview + Neon dev/preview branch (`DATABASE_URL` per env).

---

## 8. Related documents

- `docs/TECH_CARD.md` — stack decisions and checklists.
- `docs/02-TECH_SPEC.md` — functional requirements and acceptance criteria.
- `docs/BRIEF.md` — product brief.
- `docs/DECISIONS.md` — ADRs (Neon, Auth.js, feature layout, secrets).
- `.cursor/rules/bitrix24-workflow.mdc` — Bitrix sync workflow.

---

**Document version.** 1.0
