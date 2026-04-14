# Technical specification — PlanRelay web platform

**Version.** 1.0  
**Date.** 2026-04-14  
**Status.** draft (aligned with `docs/TECH_CARD.md` and `docs/01-ARCHITECTURE.md`)

---

## 1. Goals

1. Provide a **hosted** (Vercel) application for the whole team.
2. **Authenticate** users (Auth.js); persist **projects**, **phases**, **chat history**, and **plan state**.
3. Use **AI** (OpenAI, server-side) to generate and refine task plans matching the existing **YAML contract** (`epic_mode`, `epics`, tasks with `title` / `description`).
4. Allow **per-project** Bitrix parameters: `Bitrix24_Project_id`, `Task_owner_id`, `Task_Assignee_id`.
5. Keep **webhook** and **OpenAI API key** as deployment secrets (not stored per row in UI as plain text for webhook).
6. **Export** a single **Markdown** file for developers (VS Code workflow).
7. **Sync to Bitrix** via existing REST webhook flow (reuse `src/sync-plan.ts` semantics).

---

## 2. User stories (priority)

### P0 — Must have

| ID | Story | Acceptance |
|----|--------|--------------|
| US-01 | User can sign in / sign out | Auth.js session works on Vercel; protected routes redirect when anonymous |
| US-02 | User can create and name a project | Project persisted; appears in project list |
| US-03 | User can set three Bitrix fields per project | Values saved; used only server-side during sync |
| US-04 | User can open a project and chat with AI | Messages stored; assistant replies produce validatable plan JSON/YAML |
| US-05 | User sees task list (epics/tasks) and can edit/delete rows | UI reflects persisted plan state |
| US-06 | User can download plan as `.md` | File downloads; structure readable by developers |
| US-07 | User can trigger Bitrix sync | Tasks created in Bitrix per dry-run/sync rules; errors surfaced |
| US-08 | Webhook never exposed in client bundle | Audit: no `Webhook_URL` in client JS |

### P1 — Should have

| ID | Story | Acceptance |
|----|--------|--------------|
| US-09 | Phases / iterations per project | User can add phase, attach chat + plan continuation |
| US-10 | Chat history visible per project/phase | Scrollable history after reload |
| US-11 | Optional file upload to chat | Text extracted; size limit enforced; rejected types handled |

### P2 — Could have

| US-12 | YAML download as well as MD | Matches `example.plan.yaml` shape |
| US-13 | Dry-run before sync | Same as CLI `--dry-run` |

---

## 3. Functional requirements

### 3.1 Authentication

- Session-based (database sessions via Prisma adapter).
- At least one provider: **Email magic link** and/or **Google** (to be chosen in `TECH_CARD`).

### 3.2 Projects

- Fields: name, created by, timestamps.
- Settings: `bitrixProjectId` (string/number as per Bitrix), `taskOwnerId`, `taskAssigneeId`.
- **Authorization:** v1 can be “owner-only”; multi-member requires `ProjectMember` and checks on every API.

### 3.3 Phases

- Optional entity: label, order, FK to project.
- Chat and plan snapshots scoped to `(projectId, phaseId?)`.

### 3.4 AI chat

- System prompt includes YAML schema summary and examples from `plans/example.plan.yaml`.
- Model output must be **parsed and validated**; invalid output → user-visible error and retry suggestion.
- **Rate limiting** on AI endpoint (configurable).

### 3.5 Plan editing

- Represent epics and tasks in DB (or JSON document with versioning — decide at implementation).
- Support delete line, edit title/description, reorder if feasible in v1.

### 3.6 Export

- **Markdown:** headings for epics, bullet or numbered tasks; optional descriptions.
- File name: e.g. `{project-slug}-plan.md`.

### 3.7 Bitrix sync

- Reuse parsing and API calls from `src/sync-plan.ts`.
- Environment: `Webhook_URL` from Vercel; project settings override `Bitrix24_Project_id`, `Task_owner_id`, `Task_Assignee_id` for that run.
- Log outcome (success counts / errors) for user feedback.

---

## 4. Non-functional requirements

| Area | Requirement |
|------|----------------|
| Performance | First meaningful paint for dashboard < 3s on 4G (target). |
| Availability | Vercel + Neon SLA; no self-healing beyond platform. |
| Privacy | Chat content in Neon; DPA with Neon/OpenAI per company policy. |
| Observability | Structured errors; optional Sentry later. |

---

## 5. Out of scope (v1)

- Self-hosted deployment guide beyond Vercel.
- Full RBAC beyond project owner.
- Real-time collaboration (multiple cursors).
- Bitrix OAuth (app uses webhook only).

---

## 6. Open questions

1. **Project sharing:** single owner vs team invites in v1?
2. **Email provider** for magic link (Resend vs other).
3. **Exact Prisma models** for plan: normalized tables vs JSON column + version.
4. **pnpm** adoption date vs current `npm` lockfile in repo.

---

## 7. Traceability

| Spec section | Implementation artifact |
|--------------|---------------------------|
| YAML contract | `plans/example.plan.yaml`, `src/sync-plan.ts` types |
| Workflow | `.cursor/rules/bitrix24-workflow.mdc` |
| Stack | `docs/TECH_CARD.md` |
