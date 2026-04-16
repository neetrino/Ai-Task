# Bitrix24: план → задачи в проекте

## Веб-платформа PlanRelay

Документация по полнофункциональной версии (Neon, Auth.js, Next.js, Vercel):

| Документ | Содержание |
|----------|------------|
| [`docs/BRIEF.md`](docs/BRIEF.md) | Продуктовое краткое ТЗ |
| [`docs/TECH_CARD.md`](docs/TECH_CARD.md) | Технологический стек и чеклисты |
| [`docs/01-ARCHITECTURE.md`](docs/01-ARCHITECTURE.md) | Архитектура и границы модулей |
| [`docs/02-TECH_SPEC.md`](docs/02-TECH_SPEC.md) | Техническое задание (user stories, требования) |
| [`docs/DECISIONS.md`](docs/DECISIONS.md) | ADR: Neon, Auth.js, размер B, секреты |
| [`docs/PROGRESS.md`](docs/PROGRESS.md) | Прогресс внедрения |

Размер проекта в правилах Cursor: **B** (feature-based layout) — см. `.cursor/rules/00-core.mdc`.

### Запуск веб-приложения

```bash
pnpm install
cp .env.example .env   # заполните DATABASE_URL, AUTH_SECRET, OpenAI и т.д.
pnpm exec prisma migrate dev
pnpm dev
```

Откройте [http://localhost:3000](http://localhost:3000). Раздел приложения: `/app` (magic link по email; без Resend в dev ссылка логируется через `pino`).

**Синхронизация с Bitrix24** выполняется из приложения: настройте `Webhook_URL` в `.env`, а **ID проекта в Bitrix, постановщика и исполнителя** — в настройках проекта в UI (не через переменные окружения).

### Команды

| Команда | Назначение |
|---------|------------|
| `pnpm dev` | Next.js dev |
| `pnpm build` / `pnpm start` | production |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | TypeScript |
| `pnpm test` | Vitest |
| `pnpm e2e` | Playwright (нужен dev-сервер или `PLAYWRIGHT_BASE_URL`) |

---

## `.env`

| Переменная    | Описание                                      |
| ------------- | --------------------------------------------- |
| `Webhook_URL` | URL вебхука Bitrix24 со слэшем в конце        |

Остальные параметры Bitrix (проект, `CREATED_BY`, `RESPONSIBLE_ID`) задаются **в настройках проекта** в веб-приложении.

`.env` не коммитить. Шаблон — `.env.example`.

Подробности для агента: `.cursor/rules/`.

Репозиторий: [neetrino/Bitrix24-Task](https://github.com/neetrino/Bitrix24-Task).
