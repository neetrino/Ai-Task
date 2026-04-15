/**
 * Bitrix sync requires these project-scoped ids (see sync-actions).
 * UI uses the same rule for the Connection indicator.
 */
export type BitrixConnectionFields = {
  bitrixProjectId: string | null;
  taskOwnerId: string | null;
  taskAssigneeId: string | null;
};

export type BitrixConnectionComplete = BitrixConnectionFields & {
  bitrixProjectId: string;
  taskOwnerId: string;
  taskAssigneeId: string;
};

function nonEmpty(s: string | null | undefined): s is string {
  return Boolean(s?.trim());
}

export function isBitrixProjectConnectionComplete(
  project: BitrixConnectionFields,
): project is BitrixConnectionComplete {
  return (
    nonEmpty(project.bitrixProjectId) &&
    nonEmpty(project.taskOwnerId) &&
    nonEmpty(project.taskAssigneeId)
  );
}
