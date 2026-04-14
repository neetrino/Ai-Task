# Product brief — PlanRelay

**Product name (working).** PlanRelay  
**Repository.** Bitrix24-Task (CLI sync + future web app)  
**Last updated.** 2026-04-14

---

## Description

PlanRelay is a team web application that combines **AI-assisted planning**, a structured **task list** compatible with existing Bitrix24 YAML sync, **per-project Bitrix settings**, **chat history**, **project phases** (e.g. “phase 2” continuation), **Markdown export** for developers, and **one-click (or server-triggered) sync** to Bitrix using a secured incoming webhook. It extends the current repo workflow (Markdown → YAML → Bitrix) with persistence, accounts, and a minimal modern UI on **Vercel**.

---

## Target audience

- **Product / engineering leads** who define scope and want tasks in Bitrix without manual copy-paste.
- **Developers** who want a single **`.md`** file aligned with the same plan to work in VS Code.

---

## Priority features

1. **Auth + projects + phases + chat history** — high  
2. **AI chat → validated plan (YAML-shaped)** — high  
3. **Task list UI + edit/delete + AI revise** — high  
4. **Per-project Bitrix IDs** (`Bitrix24_Project_id`, `Task_owner_id`, `Task_Assignee_id`) — high  
5. **Markdown download** — high  
6. **Bitrix sync** (reuse `sync-plan` logic) — high  
7. **Webhook + OpenAI only in env** — high (security)  
8. **YAML download / dry-run** — medium  

---

## Stack (confirmed direction)

- **Frontend + API:** Next.js (App Router) on **Vercel**  
- **Database:** **Neon** (PostgreSQL) + **Prisma**  
- **Auth:** **Auth.js**  
- **AI:** OpenAI (server-side only)  
- **Bitrix:** existing incoming webhook + `src/sync-plan.ts` contract  

---

## Design

- **Minimal, modern** UI (Tailwind + shadcn/ui per TECH_CARD).  
- No unnecessary chrome; focus on chat + task list + settings + export/sync.

---

## Integrations

- [x] Authentication (Auth.js)  
- [x] AI (OpenAI API)  
- [x] Bitrix24 (incoming webhook REST)  
- [ ] Email for magic link (**Resend** or similar — TBD)  
- [ ] Object storage — not required v1 (generated files streamed)  

---

## Content language

- **UI:** English for v1 (team can add Russian later).  
- **i18n:** not required for v1.  

---

## Constraints

- **Hosting:** Vercel + Neon.  
- **Secrets:** webhook and API keys must not appear in client-side code or logs.  
- **Compliance:** follow Neon / OpenAI data processing terms for chat content.  

---

## Extra notes

- CLI workflow (`npm run sync`, `plans/*.md` / `*.yaml`) remains valid for users who do not use the web UI.  
- Product codename **PlanRelay** — relay plans to Bitrix and to developer Markdown.
