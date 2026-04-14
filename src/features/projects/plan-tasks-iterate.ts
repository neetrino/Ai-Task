import type { EpicPayload, PlanPayload, TaskPayload } from '@/shared/domain/plan';

export type FlatPlanTaskRow = {
  displayNumber: number;
  epicIndex: number;
  taskIndex: number;
  epicName: string;
  epicDescription: string | undefined;
  task: TaskPayload;
};

/** Checkbox state for Bitrix sync (respects legacy snapshots without explicit flags). */
export function isTaskSyncChecked(task: TaskPayload): boolean {
  if (task.syncSelected !== undefined) return task.syncSelected;
  return !task.bitrixSynced;
}

/** Total actionable tasks in the plan (for badges and summaries). */
export function countPlanTasks(plan: PlanPayload): number {
  return buildFlatPlanTasks(plan).length;
}

/** Linear order: epic order, then task order within each epic. Display numbers are 1…N for dashboard UI only. */
export function buildFlatPlanTasks(plan: PlanPayload): FlatPlanTaskRow[] {
  let displayNumber = 0;
  const rows: FlatPlanTaskRow[] = [];
  plan.epics.forEach((epic: EpicPayload, epicIndex: number) => {
    epic.tasks.forEach((task: TaskPayload, taskIndex: number) => {
      displayNumber += 1;
      rows.push({
        displayNumber,
        epicIndex,
        taskIndex,
        epicName: epic.name,
        epicDescription: epic.description,
        task,
      });
    });
  });
  return rows;
}

function rowMatchesQuery(row: FlatPlanTaskRow, normalizedQuery: string): boolean {
  if (!normalizedQuery) return true;
  if (row.epicName.toLowerCase().includes(normalizedQuery)) return true;
  if (row.task.title.toLowerCase().includes(normalizedQuery)) return true;
  const desc = row.task.description;
  if (desc && desc.toLowerCase().includes(normalizedQuery)) return true;
  return false;
}

export function filterFlatPlanTasks(rows: FlatPlanTaskRow[], query: string): FlatPlanTaskRow[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return rows;
  return rows.filter((row) => rowMatchesQuery(row, normalizedQuery));
}

/** Group filtered rows under epic headers, preserving epic order from the plan. */
export function groupRowsByEpicOrder(
  plan: PlanPayload,
  filteredRows: FlatPlanTaskRow[],
): { epic: EpicPayload; epicIndex: number; rows: FlatPlanTaskRow[] }[] {
  const byEpic = new Map<number, FlatPlanTaskRow[]>();
  for (const row of filteredRows) {
    const list = byEpic.get(row.epicIndex) ?? [];
    list.push(row);
    byEpic.set(row.epicIndex, list);
  }
  const result: { epic: EpicPayload; epicIndex: number; rows: FlatPlanTaskRow[] }[] = [];
  plan.epics.forEach((epic, epicIndex) => {
    const rows = byEpic.get(epicIndex);
    if (rows?.length) {
      result.push({ epic, epicIndex, rows });
    }
  });
  return result;
}

export function updateTaskSyncInPlan(
  plan: PlanPayload,
  epicIndex: number,
  taskIndex: number,
  syncSelected: boolean,
): PlanPayload {
  const epics = plan.epics.map((epic, ei) => {
    if (ei !== epicIndex) return epic;
    const tasks = epic.tasks.map((t, ti) =>
      ti === taskIndex ? { ...t, syncSelected } : t,
    );
    return { ...epic, tasks };
  });
  return { ...plan, epics };
}

export function updateTaskInPlan(
  plan: PlanPayload,
  epicIndex: number,
  taskIndex: number,
  title: string,
  description: string,
): PlanPayload {
  const trimmedTitle = title.trim() || 'Untitled';
  const trimmedDesc = description.trim();
  const epics = plan.epics.map((epic, ei) => {
    if (ei !== epicIndex) return epic;
    const tasks = epic.tasks.map((t, ti) => {
      if (ti !== taskIndex) return t;
      const next: TaskPayload = { ...t, title: trimmedTitle };
      if (trimmedDesc) {
        next.description = trimmedDesc;
      } else {
        delete next.description;
      }
      return next;
    });
    return { ...epic, tasks };
  });
  return { ...plan, epics };
}
