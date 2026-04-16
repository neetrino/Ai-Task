/**
 * URL query for the fullscreen "All tasks" panel — survives refresh and shareable links.
 * `allTasks=main` = Main phase tasks; otherwise value is a phase id.
 */
export const ALL_TASKS_PANEL_QUERY_KEY = 'allTasks';
export const ALL_TASKS_PANEL_MAIN_VALUE = 'main';

export function setAllTasksPanelQuery(
  searchParams: URLSearchParams,
  phaseId: string | null,
): URLSearchParams {
  const next = new URLSearchParams(searchParams.toString());
  next.set(
    ALL_TASKS_PANEL_QUERY_KEY,
    phaseId === null ? ALL_TASKS_PANEL_MAIN_VALUE : phaseId,
  );
  return next;
}

export function deleteAllTasksPanelQuery(searchParams: URLSearchParams): URLSearchParams {
  const next = new URLSearchParams(searchParams.toString());
  next.delete(ALL_TASKS_PANEL_QUERY_KEY);
  return next;
}

/** Phase sidebar links: preserve `allTasks` so the panel stays open when switching phases. */
export function buildProjectPageHref(
  projectSlug: string,
  options: { phaseId?: string | null; allTasks?: string | null },
): string {
  const params = new URLSearchParams();
  if (options.phaseId) params.set('phase', options.phaseId);
  if (options.allTasks) params.set(ALL_TASKS_PANEL_QUERY_KEY, options.allTasks);
  const q = params.toString();
  const base = `/app/projects/${projectSlug}`;
  return q ? `${base}?${q}` : base;
}
