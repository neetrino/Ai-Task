import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { config } from "dotenv";
import { parse as parseYaml } from "yaml";

config();

type TaskSpec = {
  title: string;
  description?: string;
};

type EpicSpec = {
  name: string;
  description?: string;
  tasks: TaskSpec[];
};

type Plan = {
  project_title?: string;
  epic_mode: "scrum" | "parent_tasks";
  responsible_id?: number;
  epics: EpicSpec[];
};

type TaskAddResult = { task: { id: string } };
type EpicAddResult = { id: number };

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}

function parseTaskSpec(x: unknown, epicPath: string, index: number): TaskSpec {
  if (!isRecord(x)) throw new Error(`${epicPath}: tasks[${index}] must be an object`);
  const title = x.title;
  if (typeof title !== "string" || title.trim() === "") {
    throw new Error(`${epicPath}: tasks[${index}].title is required`);
  }
  const description = x.description;
  if (description !== undefined && typeof description !== "string") {
    throw new Error(`${epicPath}: tasks[${index}].description must be a string`);
  }
  return { title: title.trim(), description: description?.trim() };
}

function parseEpicSpec(x: unknown, index: number): EpicSpec {
  const path = `epics[${index}]`;
  if (!isRecord(x)) throw new Error(`${path} must be an object`);
  const name = x.name;
  if (typeof name !== "string" || name.trim() === "") {
    throw new Error(`${path}.name is required`);
  }
  const rawTasks = x.tasks;
  if (!Array.isArray(rawTasks) || rawTasks.length === 0) {
    throw new Error(`${path}.tasks must be a non-empty array`);
  }
  const tasks = rawTasks.map((t, i) => parseTaskSpec(t, path, i));
  const description = x.description;
  if (description !== undefined && typeof description !== "string") {
    throw new Error(`${path}.description must be a string`);
  }
  return { name: name.trim(), description: description?.trim(), tasks };
}

function parsePlan(raw: unknown): Plan {
  if (!isRecord(raw)) throw new Error("Plan root must be an object");
  const mode = raw.epic_mode;
  if (mode !== "scrum" && mode !== "parent_tasks") {
    throw new Error('epic_mode must be "scrum" or "parent_tasks"');
  }
  const epicsRaw = raw.epics;
  if (!Array.isArray(epicsRaw) || epicsRaw.length === 0) {
    throw new Error("epics must be a non-empty array");
  }
  const epics = epicsRaw.map((e, i) => parseEpicSpec(e, i));
  const project_title = raw.project_title;
  if (project_title !== undefined && typeof project_title !== "string") {
    throw new Error("project_title must be a string");
  }
  const responsible_id = raw.responsible_id;
  if (responsible_id !== undefined && typeof responsible_id !== "number") {
    throw new Error("responsible_id must be a number");
  }
  return {
    project_title: project_title?.trim(),
    epic_mode: mode,
    responsible_id,
    epics,
  };
}

async function bitrixCall<T>(
  webhookBase: string,
  method: string,
  body: Record<string, unknown>
): Promise<T> {
  const url = `${webhookBase}${method}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as {
    result?: T;
    error?: string;
    error_description?: string;
  };
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${JSON.stringify(json)}`);
  }
  if (json.error) {
    throw new Error(`${json.error}: ${json.error_description ?? ""}`);
  }
  return json.result as T;
}

function loadEnv(): { webhook: string; groupId: number; responsibleId: number } {
  const webhook = process.env.Webhook_URL?.trim();
  const idRaw = process.env.Bitrix24_Project_id?.trim();
  const respRaw = process.env.Bitrix24_responsible_id?.trim();
  if (!webhook) throw new Error("Missing Webhook_URL in .env");
  if (!idRaw) throw new Error("Missing Bitrix24_Project_id in .env");
  const groupId = Number(idRaw);
  if (!Number.isFinite(groupId)) {
    throw new Error("Bitrix24_Project_id must be a number");
  }
  const responsibleId = respRaw ? Number(respRaw) : 1;
  if (!Number.isFinite(responsibleId)) {
    throw new Error("Bitrix24_responsible_id must be a number");
  }
  return { webhook, groupId, responsibleId };
}

function parseArgs(argv: string[]): { planPath: string; dryRun: boolean } {
  const rest = argv.slice(2).filter((a) => a !== "--");
  const dryRun = rest.includes("--dry-run");
  const pathArg = rest.find((a) => !a.startsWith("--"));
  if (!pathArg) {
    throw new Error('Usage: npm run sync -- <path-to-plan.yaml> [--dry-run]');
  }
  return { planPath: resolve(pathArg), dryRun };
}

async function syncScrum(
  plan: Plan,
  webhook: string,
  groupId: number,
  responsibleId: number,
  dryRun: boolean
): Promise<void> {
  const rid = plan.responsible_id ?? responsibleId;
  for (const epic of plan.epics) {
    if (dryRun) {
      console.log(`[dry-run] epic: ${epic.name} (${epic.tasks.length} tasks)`);
      continue;
    }
    const epicResult = await bitrixCall<EpicAddResult>(webhook, "tasks.api.scrum.epic.add", {
      fields: {
        name: epic.name,
        groupId,
        description: epic.description ?? "",
      },
    });
    const epicId = epicResult.id;
    console.log(`Epic created: id=${epicId} name=${epic.name}`);
    for (const task of epic.tasks) {
      const taskResult = await bitrixCall<TaskAddResult>(webhook, "tasks.task.add", {
        fields: {
          TITLE: task.title,
          DESCRIPTION: task.description ?? "",
          GROUP_ID: groupId,
          RESPONSIBLE_ID: rid,
          CREATED_BY: rid,
          epicId,
        },
      });
      console.log(`  Task: id=${taskResult.task.id} ${task.title}`);
    }
  }
}

async function syncParentTasks(
  plan: Plan,
  webhook: string,
  groupId: number,
  responsibleId: number,
  dryRun: boolean
): Promise<void> {
  const rid = plan.responsible_id ?? responsibleId;
  for (const epic of plan.epics) {
    if (dryRun) {
      console.log(`[dry-run] parent task: ${epic.name} + ${epic.tasks.length} subtasks`);
      continue;
    }
    const parent = await bitrixCall<TaskAddResult>(webhook, "tasks.task.add", {
      fields: {
        TITLE: epic.name,
        DESCRIPTION: epic.description ?? "",
        GROUP_ID: groupId,
        RESPONSIBLE_ID: rid,
        CREATED_BY: rid,
      },
    });
    const parentId = Number(parent.task.id);
    console.log(`Epic (parent task): id=${parentId} ${epic.name}`);
    for (const task of epic.tasks) {
      const taskResult = await bitrixCall<TaskAddResult>(webhook, "tasks.task.add", {
        fields: {
          TITLE: task.title,
          DESCRIPTION: task.description ?? "",
          GROUP_ID: groupId,
          RESPONSIBLE_ID: rid,
          CREATED_BY: rid,
          PARENT_ID: parentId,
        },
      });
      console.log(`  Task: id=${taskResult.task.id} ${task.title}`);
    }
  }
}

async function main(): Promise<void> {
  const { planPath, dryRun } = parseArgs(process.argv);
  const raw = readFileSync(planPath, "utf8");
  const plan = parsePlan(parseYaml(raw));
  const { webhook, groupId, responsibleId } = loadEnv();

  console.log(
    `Plan: ${plan.project_title ?? planPath}\n` +
      `Mode: ${plan.epic_mode}, groupId=${groupId}, dryRun=${dryRun}\n`
  );

  if (plan.epic_mode === "scrum") {
    await syncScrum(plan, webhook, groupId, responsibleId, dryRun);
  } else {
    await syncParentTasks(plan, webhook, groupId, responsibleId, dryRun);
  }
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
