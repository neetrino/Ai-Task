'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useTransition, type ReactNode } from 'react';
import type { PlanPayload } from '@/shared/domain/plan';
import { savePlanSnapshot } from '@/features/plan-editor/plan-actions';
import { setPlanTaskSyncSelected } from '@/features/bitrix-sync/plan-sync-actions';
import {
  isTaskSyncChecked,
  removeTaskFromPlan,
  updateTaskInPlan,
  updateTaskSyncInPlan,
  type FlatPlanTaskRow,
} from '@/features/projects/plan-tasks-iterate';
import { PlanTasksFullscreenModal } from '@/features/projects/PlanTasksFullscreenModal';
import { ProjectPlanTasksProvider } from '@/features/projects/project-plan-tasks-context';
import {
  type PlanTasksEditingTarget,
  usePlanTasksPanelUrlSync,
} from '@/features/projects/use-plan-tasks-panel-url-sync';
import { logger } from '@/shared/lib/logger';
import { toast } from 'sonner';

async function setPlanTaskSyncSelectedSafe(
  projectId: string,
  phaseId: string | null,
  epicIndex: number,
  taskIndex: number,
  syncSelected: boolean,
): Promise<{ ok: true } | { error: string }> {
  try {
    return await setPlanTaskSyncSelected(projectId, phaseId, epicIndex, taskIndex, syncSelected);
  } catch (e) {
    logger.error({ err: e, projectId }, 'setPlanTaskSyncSelected failed');
    return { error: e instanceof Error ? e.message : 'Request failed' };
  }
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
  const [plan, setPlan] = useState<PlanPayload>(initialPlan);
  const [modalPlan, setModalPlan] = useState<PlanPayload | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalPhaseId, setModalPhaseId] = useState<string | null>(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<PlanTasksEditingTarget | null>(null);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftDescription, setDraftDescription] = useState('');
  const [savePending, startSaveTransition] = useTransition();

  const planSyncKey = `${projectId}:${activePhaseId ?? 'main'}`;
  const planSyncKeyRef = useRef<string | null>(null);

  const phasePlanCacheRef = useRef<Map<string, PlanPayload>>(new Map());

  const phaseCacheKey = useCallback(
    (phaseId: string | null) => `${projectSlug}:${phaseId ?? 'main'}`,
    [projectSlug],
  );

  useEffect(() => {
    if (planSyncKeyRef.current !== planSyncKey) {
      planSyncKeyRef.current = planSyncKey;
      setPlan(initialPlan);
    }
  }, [planSyncKey, initialPlan]);

  const effectivePlan = modalPlan ?? plan;
  const effectivePhaseId = modalPhaseId;

  const exportMarkdownHref = useMemo(() => {
    return modalPhaseId
      ? `/api/projects/${encodeURIComponent(projectSlug)}/export?phase=${encodeURIComponent(modalPhaseId)}`
      : `/api/projects/${encodeURIComponent(projectSlug)}/export`;
  }, [modalPhaseId, projectSlug]);

  const cachePlanForCurrentModal = useCallback(
    (payload: PlanPayload) => {
      const key = phaseCacheKey(effectivePhaseId);
      phasePlanCacheRef.current.set(key, payload);
    },
    [effectivePhaseId, phaseCacheKey],
  );

  const { closeModal, openTasksForPhase } = usePlanTasksPanelUrlSync({
    activePhaseId,
    modalOpen,
    modalPhaseId,
    phaseCacheKey,
    phasePlanCacheRef,
    projectSlug,
    setEditing,
    setFetchError,
    setModalOpen,
    setModalPhaseId,
    setModalPlan,
    setPlanLoading,
    setSearch,
  });

  const beginEdit = useCallback((row: FlatPlanTaskRow) => {
    setEditing({ epicIndex: row.epicIndex, taskIndex: row.taskIndex });
    setDraftTitle(row.task.title);
    setDraftDescription(row.task.description ?? '');
  }, []);

  const cancelEdit = useCallback(() => {
    setEditing(null);
    setDraftTitle('');
    setDraftDescription('');
  }, []);

  const deleteEdit = useCallback(() => {
    if (!editing) return;
    if (!globalThis.confirm('Delete this task? This cannot be undone.')) return;

    const next = removeTaskFromPlan(effectivePlan, editing.epicIndex, editing.taskIndex);
    const capturedEditing = editing;
    const capturedDraftTitle = draftTitle;
    const capturedDraftDescription = draftDescription;
    const prevMain = plan;
    const prevModal = modalPlan;

    if (modalPlan !== null) {
      setModalPlan(next);
    } else {
      setPlan(next);
    }
    cachePlanForCurrentModal(next);
    setEditing(null);
    setDraftTitle('');
    setDraftDescription('');

    startSaveTransition(async () => {
      const res = await savePlanSnapshot(projectId, effectivePhaseId, JSON.stringify(next));
      if (res && 'error' in res && res.error) {
        toast.error(res.error);
        if (prevModal !== null) {
          setModalPlan(prevModal);
        } else {
          setPlan(prevMain);
        }
        cachePlanForCurrentModal(prevModal ?? prevMain);
        setEditing(capturedEditing);
        setDraftTitle(capturedDraftTitle);
        setDraftDescription(capturedDraftDescription);
      }
    });
  }, [
    cachePlanForCurrentModal,
    draftDescription,
    draftTitle,
    editing,
    effectivePhaseId,
    effectivePlan,
    modalPlan,
    plan,
    projectId,
  ]);

  const saveEdit = useCallback(() => {
    if (!editing) return;
    const next = updateTaskInPlan(
      effectivePlan,
      editing.epicIndex,
      editing.taskIndex,
      draftTitle,
      draftDescription,
    );
    const capturedEditing = editing;
    const capturedDraftTitle = draftTitle;
    const capturedDraftDescription = draftDescription;
    const prevMain = plan;
    const prevModal = modalPlan;

    if (modalPlan !== null) {
      setModalPlan(next);
    } else {
      setPlan(next);
    }
    cachePlanForCurrentModal(next);
    setEditing(null);
    setDraftTitle('');
    setDraftDescription('');

    startSaveTransition(async () => {
      const res = await savePlanSnapshot(projectId, effectivePhaseId, JSON.stringify(next));
      if (res && 'error' in res && res.error) {
        toast.error(res.error);
        if (prevModal !== null) {
          setModalPlan(prevModal);
        } else {
          setPlan(prevMain);
        }
        cachePlanForCurrentModal(prevModal ?? prevMain);
        setEditing(capturedEditing);
        setDraftTitle(capturedDraftTitle);
        setDraftDescription(capturedDraftDescription);
      }
    });
  }, [
    cachePlanForCurrentModal,
    draftDescription,
    draftTitle,
    editing,
    effectivePhaseId,
    effectivePlan,
    modalPlan,
    plan,
    projectId,
  ]);

  const toggleRowBitrixSync = useCallback(
    (row: FlatPlanTaskRow) => {
      const nextSelected = !isTaskSyncChecked(row.task);
      const updater = (p: PlanPayload) =>
        updateTaskSyncInPlan(p, row.epicIndex, row.taskIndex, nextSelected);

      const prevMain = plan;
      const prevModal = modalPlan;

      let optimisticPlan: PlanPayload;
      if (modalPlan !== null) {
        optimisticPlan = updater(modalPlan);
        setModalPlan(optimisticPlan);
      } else {
        optimisticPlan = updater(plan);
        setPlan(optimisticPlan);
      }
      cachePlanForCurrentModal(optimisticPlan);

      void (async () => {
        const res = await setPlanTaskSyncSelectedSafe(
          projectId,
          effectivePhaseId,
          row.epicIndex,
          row.taskIndex,
          nextSelected,
        );
        if ('error' in res && res.error) {
          toast.error(res.error);
          if (prevModal !== null) {
            setModalPlan(prevModal);
          } else {
            setPlan(prevMain);
          }
          cachePlanForCurrentModal(prevModal ?? prevMain);
        }
      })();
    },
    [cachePlanForCurrentModal, effectivePhaseId, modalPlan, plan, projectId],
  );

  const contextValue = useMemo(() => ({ openTasksForPhase }), [openTasksForPhase]);

  return (
    <ProjectPlanTasksProvider value={contextValue}>
      {children}
      <PlanTasksFullscreenModal
        draftDescription={draftDescription}
        draftTitle={draftTitle}
        editing={editing}
        exportMarkdownHref={exportMarkdownHref}
        fetchError={fetchError}
        onBeginEdit={beginEdit}
        onCancelEdit={cancelEdit}
        onClose={closeModal}
        onDeleteEdit={deleteEdit}
        onDraftDescriptionChange={setDraftDescription}
        onDraftTitleChange={setDraftTitle}
        onSaveEdit={saveEdit}
        onSearchChange={setSearch}
        onToggleSync={toggleRowBitrixSync}
        open={modalOpen}
        phaseId={modalPhaseId}
        plan={effectivePlan}
        planLoading={planLoading}
        projectId={projectId}
        savePending={savePending}
        search={search}
      />
    </ProjectPlanTasksProvider>
  );
}
