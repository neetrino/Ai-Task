import { revalidateTag } from 'next/cache';

const PROJECT_DATA_PREFIX = 'project-data';

/**
 * Tag for Next.js `unstable_cache` / `revalidateTag` — scoped by project id.
 * Invalidate after any mutation that affects project page data (plan, chat, phases).
 */
export function projectDataTag(projectId: string): string {
  return `${PROJECT_DATA_PREFIX}:${projectId}`;
}

export function revalidateProjectData(projectId: string): void {
  revalidateTag(projectDataTag(projectId));
}
