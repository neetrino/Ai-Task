'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, type Dispatch, type MutableRefObject, type SetStateAction } from 'react';
import type { PlanPayload } from '@/shared/domain/plan';
import { BITRIX_SYNC_CONFIRM_PORTAL_SELECTOR } from '@/features/bitrix-sync/BitrixSyncConfirmDialog';
import {
  ALL_TASKS_PANEL_DOM_ID,
  TASK_LIST_TOGGLE_SELECTOR,
} from '@/features/projects/plan-tasks-layout';
import {
  ALL_TASKS_PANEL_MAIN_VALUE,
  ALL_TASKS_PANEL_QUERY_KEY,
  deleteAllTasksPanelQuery,
  setAllTasksPanelQuery,
} from '@/features/projects/project-plan-tasks-url';
import { logger } from '@/shared/lib/logger';
import { toast } from 'sonner';

function phasesMatch(a: string | null, b: string | null): boolean {
  return a === b;
}

export type PlanTasksEditingTarget = { epicIndex: number; taskIndex: number };

export function usePlanTasksPanelUrlSync({
  activePhaseId,
  projectSlug,
  phaseCacheKey,
  phasePlanCacheRef,
  modalOpen,
  modalPhaseId,
  setModalOpen,
  setModalPlan,
  setModalPhaseId,
  setFetchError,
  setSearch,
  setEditing,
  setPlanLoading,
}: {
  activePhaseId: string | null;
  projectSlug: string;
  phaseCacheKey: (phaseId: string | null) => string;
  phasePlanCacheRef: MutableRefObject<Map<string, PlanPayload>>;
  modalOpen: boolean;
  modalPhaseId: string | null;
  setModalOpen: Dispatch<SetStateAction<boolean>>;
  setModalPlan: Dispatch<SetStateAction<PlanPayload | null>>;
  setModalPhaseId: Dispatch<SetStateAction<string | null>>;
  setFetchError: Dispatch<SetStateAction<string | null>>;
  setSearch: Dispatch<SetStateAction<string>>;
  setEditing: Dispatch<SetStateAction<PlanTasksEditingTarget | null>>;
  setPlanLoading: Dispatch<SetStateAction<boolean>>;
}): { closeModal: () => void; openTasksForPhase: (targetPhaseId: string | null) => void } {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const allTasksParam = searchParams.get(ALL_TASKS_PANEL_QUERY_KEY);

  const closeModalInternal = useCallback(() => {
    setModalOpen(false);
    setModalPlan(null);
    setModalPhaseId(null);
    setFetchError(null);
    setSearch('');
    setEditing(null);
    setPlanLoading(false);
  }, [
    setEditing,
    setFetchError,
    setModalOpen,
    setModalPhaseId,
    setModalPlan,
    setPlanLoading,
    setSearch,
  ]);

  const searchParamsString = useMemo(() => searchParams.toString(), [searchParams]);

  const closeModal = useCallback(() => {
    closeModalInternal();
    const params = deleteAllTasksPanelQuery(new URLSearchParams(searchParamsString));
    const q = params.toString();
    router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
  }, [closeModalInternal, pathname, router, searchParamsString]);

  const loadModalForPhase = useCallback(
    async (targetPhaseId: string | null, signal?: AbortSignal) => {
      setFetchError(null);
      setSearch('');
      setEditing(null);
      setModalPhaseId(targetPhaseId);
      setModalOpen(true);

      const sameAsActive = phasesMatch(targetPhaseId, activePhaseId);
      if (sameAsActive) {
        setModalPlan(null);
        setPlanLoading(false);
        return;
      }

      const cacheKey = phaseCacheKey(targetPhaseId);
      const cached = phasePlanCacheRef.current.get(cacheKey);
      if (cached) {
        setModalPlan(cached);
        setPlanLoading(false);
        return;
      }

      setPlanLoading(true);
      setModalPlan(null);
      try {
        const q = targetPhaseId ? `?phase=${encodeURIComponent(targetPhaseId)}` : '';
        const res = await fetch(`/api/projects/${encodeURIComponent(projectSlug)}/plan${q}`, {
          signal,
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          const msg = typeof err?.error === 'string' ? err.error : 'Could not load plan';
          throw new Error(msg);
        }
        const data: { plan: PlanPayload } = await res.json();
        if (signal?.aborted) return;
        setModalPlan(data.plan);
        phasePlanCacheRef.current.set(cacheKey, data.plan);
      } catch (e) {
        if (e instanceof Error && e.name === 'AbortError') return;
        logger.error({ err: e }, 'project.plan.fetch');
        const msg = e instanceof Error ? e.message : 'Could not load plan';
        toast.error(msg);
        setFetchError(msg);
      } finally {
        if (!signal?.aborted) {
          setPlanLoading(false);
        }
      }
    },
    [
      activePhaseId,
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
    ],
  );

  useEffect(() => {
    if (allTasksParam === null || allTasksParam === '') {
      closeModalInternal();
      return;
    }
    const phaseId = allTasksParam === ALL_TASKS_PANEL_MAIN_VALUE ? null : allTasksParam;
    const ac = new AbortController();
    void loadModalForPhase(phaseId, ac.signal);
    return () => ac.abort();
  }, [allTasksParam, closeModalInternal, loadModalForPhase]);

  const openTasksForPhase = useCallback(
    (targetPhaseId: string | null) => {
      if (modalOpen && phasesMatch(modalPhaseId, targetPhaseId)) {
        closeModal();
        return;
      }
      const params = setAllTasksPanelQuery(new URLSearchParams(searchParamsString), targetPhaseId);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [closeModal, modalOpen, modalPhaseId, pathname, router, searchParamsString],
  );

  useEffect(() => {
    if (!modalOpen) return;
    const onPointerDownCapture = (e: PointerEvent) => {
      const target = e.target;
      if (!(target instanceof Node)) return;
      const panel = document.getElementById(ALL_TASKS_PANEL_DOM_ID);
      if (panel?.contains(target)) return;
      if (target instanceof Element && target.closest(TASK_LIST_TOGGLE_SELECTOR)) return;
      if (target instanceof Element && target.closest(BITRIX_SYNC_CONFIRM_PORTAL_SELECTOR)) return;
      closeModal();
    };
    document.addEventListener('pointerdown', onPointerDownCapture, true);
    return () => document.removeEventListener('pointerdown', onPointerDownCapture, true);
  }, [closeModal, modalOpen]);

  return useMemo(() => ({ closeModal, openTasksForPhase }), [closeModal, openTasksForPhase]);
}
