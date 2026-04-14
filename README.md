# Bitrix24: план → задачи в проекте

## Веб-платформа PlanRelay (в разработке)

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

---

## CLI: Markdown → YAML → Bitrix

**Сначала** черновик в **`plans/*.md`** (удобно читать), шаблон — `plans/example-plan.md` (структура как у обычного `plan.md`: заголовки `##` = эпики, списки = задачи). Файлы вида `*.plan.md` в этом проекте открываются как Markdown — см. `.vscode/settings.json`. **После согласования** — перенос в **`plans/*.yaml`** (`plans/example.plan.yaml`) и синхронизация с Bitrix. Смена проекта: **`Bitrix24_Project_id`** в `.env`. Подробнее — `.cursor/rules/bitrix24-workflow.mdc`.

## `.env`

| Переменная                | Описание                                                                           |
| ------------------------- | ---------------------------------------------------------------------------------- |
| `Webhook_URL`             | URL вебхука со слэшем в конце                                                      |
| `Bitrix24_Project_id`     | ID группы / проекта / Scrum в Bitrix                                               |
| `Task_owner_id`           | `CREATED_BY` — постановщик (от чьего имени создаётся задача)                       |
| `Task_Assignee_id`        | `RESPONSIBLE_ID` — исполнитель (в YAML `responsible_id` переопределяет только его) |
| `Bitrix24_responsible_id` | Опционально: fallback для owner и assignee, если переменные выше не заданы         |

`.env` не коммитить. Шаблон — `.env.example`.

## Команды

Один раз после клонирования:

```bash
npm install
```

Проверка плана без создания задач в Bitrix:

```bash
npm run sync -- plans/example.plan.yaml --dry-run
```

Создание эпиков и задач в Bitrix (после проверки плана):

```bash
npm run sync -- plans/example.plan.yaml
```

Своё ТЗ — копируйте `example-plan.md` / `example.plan.yaml` в новые файлы и подставьте имя в командах `sync`.

Поле **`epic_mode`**: `scrum` (эпики API) или `parent_tasks` (родитель + подзадачи), если Scrum/API эпика недоступен.

Подробности для агента: `.cursor/rules/`.

Репозиторий: [neetrino/Bitrix24-Task](https://github.com/neetrino/Bitrix24-Task).
