'use client';

import { createContext, useContext, type ReactNode } from 'react';

type ProjectPlanTasksContextValue = {
  openTasksForPhase: (phaseId: string | null) => void;
};

const ProjectPlanTasksContext = createContext<ProjectPlanTasksContextValue | null>(null);

export function useProjectPlanTasks(): ProjectPlanTasksContextValue {
  const ctx = useContext(ProjectPlanTasksContext);
  if (!ctx) {
    throw new Error('useProjectPlanTasks must be used within ProjectPlanTasksHost');
  }
  return ctx;
}

export function ProjectPlanTasksProvider({
  value,
  children,
}: {
  value: ProjectPlanTasksContextValue;
  children: ReactNode;
}) {
  return (
    <ProjectPlanTasksContext.Provider value={value}>{children}</ProjectPlanTasksContext.Provider>
  );
}
