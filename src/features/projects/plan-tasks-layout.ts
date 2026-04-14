/**
 * Project page: left rail (meta + phases) + chat column split.
 * Aside width band for the ChatGPT-style phase list; tasks open from per-phase controls.
 */
export const TASKS_ASIDE_MIN_WIDTH_PX = 260;
export const TASKS_ASIDE_MAX_WIDTH_PX = 340;

/**
 * Full className for the project page two-column grid. Must stay a static string for Tailwind JIT.
 * Left rail: ChatGPT-style sidebar (meta + phases); slightly narrower min for a denser rail.
 * lg:grid-cols-[minmax(260px,340px)_minmax(0,1fr)]
 */
export const PROJECT_TASKS_CHAT_GRID_CLASS =
  'grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-hidden lg:grid-cols-[minmax(260px,340px)_minmax(0,1fr)] lg:gap-4 lg:-mx-6';
