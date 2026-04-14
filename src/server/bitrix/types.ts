export type TaskSpec = {
  title: string;
  description?: string;
  /** Granularity for planning / export; not sent as a Bitrix field by default. */
  size?: 'small' | 'medium' | 'large';
};

export type EpicSpec = {
  name: string;
  description?: string;
  tasks: TaskSpec[];
};

export type Plan = {
  project_title?: string;
  epic_mode: 'scrum' | 'parent_tasks';
  responsible_id?: number;
  decomposition_level?: 'coarse' | 'balanced' | 'fine';
  decomposition_estimate_note?: string;
  epics: EpicSpec[];
};

export type TaskAddResult = { task: { id: string } };
export type EpicAddResult = { id: number };
