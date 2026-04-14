'use client';

import { useCallback, useEffect, useMemo, useState, useTransition, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { PlanPayload } from '@/shared/domain/plan';
import { savePlanSnapshot } from '@/features/plan-editor/plan-actions';
import { setPlanTaskSyncSelected } from '@/features/bitrix-sync/plan-sync-actions';
import {
  isTaskSyncChecked,
  updateTaskInPlan,
  updateTaskSyncInPlan,
  type FlatPlanTaskRow,
} from '@/features/projects/plan-tasks-iterate';
import { PlanTasksFullscreenModal } from '@/features/projects/PlanTasksFullscreenModal';
import { ProjectPlanTasksProvider } from '@/features/projects/project-plan-tasks-context';
import { logger } from '@/shared/lib/logger';

type EditingTarget = { epicIndex: number; taskIndex: number };

function phasesMatch(a: string | null, b: string | null): boolean {
  return a === b;
}

export function ProjectPlanTasksHost({
  children,
  initialPlan,
  projectId,
  projectSlug,
  activePhaseId,
}: {
  children: ReactNode;
  initialPlan: PlanPayload;
  projectId: string;
  projectSlug: string;
  activePhaseId: string | null;
}) {
  const router = useRouter();
  const [plan, setPlan] = useState<PlanPayload>(initialPlan);
  const [modalPlan, setModalPlan] = useState<PlanPayload | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalPhaseId, setModalPhaseId] = useState<string | null>(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<EditingTarget | null>(null);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftDescription, setDraftDescription] = useState('');
  const [saveNote, setSaveNote] = useState<string | null>(null);
  const [syncNote, setSyncNote] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setPlan(initialPlan);
  }, [initialPlan]);

  const effectivePlan = modalPlan ?? plan;
  const effectivePhaseId = modalPhaseId;

  const openTasksForPhase = useCallback(
    async (targetPhaseId: string | null) => {
      setFetchError(null);
      setSearch('');
      setEditing(null);
      setSaveNote(null);
      setSyncNote(null);
      setModalPhaseId(targetPhaseId);
      setModalOpen(true);

      const sameAsActive = phasesMatch(targetPhaseId, activePhaseId);
      if (sameAsActive) {
        setModalPlan(null);
        setPlanLoading(false);
        return;
      }

      setPlanLoading(true);
      setModalPlan(null);
      try {
        const q = targetPhaseId ? `?phase=${encodeURIComponent(targetPhaseId)}` : '';
        const res = await fetch(`/api/projects/${encodeURIComponent(projectSlug)}/plan${q}`);
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          const msg = typeof err?.error === 'string' ? err.error : 'Could not load plan';
          throw new Error(msg);
        }
        const data: { plan: PlanPayload } = await res.json();
        setModalPlan(data.plan);
      } catch (e) {
        logger.error({ err: e }, 'project.plan.fetch');
        setFetchError(e instanceof Error ? e.message : 'Could not load plan');
      } finally {
        setPlanLoading(false);
      }
    },
    [activePhaseId, projectSlug],
  );

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setModalPlan(null);
    setModalPhaseId(null);
    setFetchError(null);
    setSearch('');
    setEditing(null);
    setSaveNote(null);
    setSyncNote(null);
  }, []);

  const beginEdit = useCallback((row: FlatPlanTaskRow) => {
    setEditing({ epicIndex: row.epicIndex, taskIndex: row.taskIndex });
    setDraftTitle(row.task.title);
    setDraftDescription(row.task.description ?? '');
    setSaveNote(null);
  }, []);

  const cancelEdit = useCallback(() => {
    setEditing(null);
    setDraftTitle('');
    setDraftDescription('');
  }, []);

  const saveEdit = useCallback(() => {
    if (!editing) return;
    const next = updateTaskInPlan(
      effectivePlan,
      editing.epicIndex,
      editing.taskIndex,
      draftTitle,
      draftDescription,
    );
    setSaveNote(null);
    startTransition(async () => {
      const res = await savePlanSnapshot(projectId, effectivePhaseId, JSON.stringify(next));
      if (res && 'error' in res && res.error) {
        setSaveNote(res.error);
        return;
      }
      if (modalPlan !== null) {
        setModalPlan(next);
      } else {
        setPlan(next);
      }
      setEditing(null);
      setDraftTitle('');
      setDraftDescription('');
      router.refresh();
    });
  }, [draftDescription, draftTitle, editing, effectivePhaseId, effectivePlan, modalPlan, projectId, router]);

  const toggleRowBitrixSync = useCallback(
    (row: FlatPlanTaskRow) => {
      const nextSelected = !isTaskSyncChecked(row.task);
      setSyncNote(null);
      startTransition(async () => {
        const res = await setPlanTaskSyncSelected(
          projectId,
          effectivePhaseId,
          row.epicIndex,
          row.taskIndex,
          nextSelected,
        );
        if ('error' in res && res.error) {
          setSyncNote(res.error);
          return;
        }
        const updater = (p: PlanPayload) =>
          updateTaskSyncInPlan(p, row.epicIndex, row.taskIndex, nextSelected);
        if (modalPlan !== null) {
          setModalPlan((prev) => (prev ? updater(prev) : prev));
        } else {
          setPlan(updater);
        }
        router.refresh();
      });
    },
    [effectivePhaseId, modalPlan, projectId, router],
  );

  const contextValue = useMemo(() => ({ openTasksForPhase }), [openTasksForPhase]);

  return (
    <ProjectPlanTasksProvider value={contextValue}>
      {children}
      <PlanTasksFullscreenModal
        draftDescription={draftDescription}
        draftTitle={draftTitle}
        editing={editing}
        fetchError={fetchError}
        onBeginEdit={beginEdit}
        onCancelEdit={cancelEdit}
        onClose={closeModal}
        onDraftDescriptionChange={setDraftDescription}
        onDraftTitleChange={setDraftTitle}
        onSaveEdit={saveEdit}
        onSearchChange={setSearch}
        onToggleSync={toggleRowBitrixSync}
        open={modalOpen}
        pending={pending}
        phaseId={effectivePhaseId}
        plan={effectivePlan}
        planLoading={planLoading}
        projectSlug={projectSlug}
        saveNote={saveNote}
        search={search}
        syncNote={syncNote}
      />
    </ProjectPlanTasksProvider>
  );
}
