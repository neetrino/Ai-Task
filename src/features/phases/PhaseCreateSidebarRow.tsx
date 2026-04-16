'use client';

import {
  useActionState,
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from 'react';
import { useRouter } from 'next/navigation';
import { useFormStatus } from 'react-dom';
import { toast } from 'sonner';
import { createPhase, type CreatePhaseState } from '@/features/phases/phase-actions';

const PHASE_CREATE_PLUS_BASE =
  'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-base leading-none transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/30';

/** Fixed row height so toggling idle / edit does not shift the phase list below. */
const PHASE_CREATE_ROW_OUTER =
  'flex h-10 w-full min-w-0 shrink-0 items-center gap-2 rounded-lg px-1';

/** Mouse clicks on native buttons steal focus and can leave a stuck :focus-visible ring; keyboard use is unchanged. */
function preventMouseFocusOnButton(e: React.PointerEvent<HTMLButtonElement>) {
  if (e.pointerType === 'mouse' && e.button === 0) {
    e.preventDefault();
  }
}

function PhaseCreateSubmitPlus({
  disabled,
  hasAccent,
}: {
  disabled: boolean;
  hasAccent: boolean;
}) {
  const { pending } = useFormStatus();
  const muted = `${PHASE_CREATE_PLUS_BASE} border-white/[0.08] bg-white/[0.02] text-neutral-400`;
  const accent = `${PHASE_CREATE_PLUS_BASE} border-violet-500/40 bg-violet-600 text-white shadow-sm hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50`;
  const className = pending ? accent : hasAccent ? accent : muted;
  return (
    <button
      aria-label="Create phase"
      className={className}
      disabled={disabled || pending}
      type="submit"
    >
      {pending ? '…' : '+'}
    </button>
  );
}

/** Matches idle label slot: h-7 field + same border box as transparent idle placeholder. */
const PHASE_CREATE_INPUT_CLASS =
  'box-border h-7 min-w-0 flex-1 basis-0 rounded-lg border border-white/10 bg-workspace-canvas px-2 py-0 text-sm leading-7 text-neutral-200 placeholder:text-neutral-500 shadow-none focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/25';

function PhaseCreateIdleRow({ onStart }: { onStart: () => void }) {
  return (
    <div className={PHASE_CREATE_ROW_OUTER}>
      <button
        aria-label="Add new phase"
        className={`${PHASE_CREATE_PLUS_BASE} border-white/[0.08] bg-white/[0.02] text-neutral-400 transition hover:border-white/12 hover:bg-white/[0.04] hover:text-neutral-300`}
        onClick={onStart}
        onPointerDown={preventMouseFocusOnButton}
        type="button"
      >
        +
      </button>
      <button
        className="box-border flex h-7 min-w-0 flex-1 basis-0 items-center truncate border border-transparent bg-transparent px-2 text-left text-sm font-medium leading-7 text-neutral-400 shadow-none outline-none ring-0 transition hover:text-neutral-200 focus-visible:outline-none focus-visible:ring-0 focus-visible:underline"
        onClick={onStart}
        onPointerDown={preventMouseFocusOnButton}
        type="button"
      >
        New phase
      </button>
    </div>
  );
}

type PhaseCreateEditingFormProps = {
  action: (payload: FormData) => void;
  hasText: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
  onCancel: () => void;
  onChange: (value: string) => void;
  value: string;
};

function PhaseCreateEditingForm({
  action,
  hasText,
  inputRef,
  onCancel,
  onChange,
  value,
}: PhaseCreateEditingFormProps) {
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      const t = e.target;
      if (!(t instanceof Node)) return;
      if (formRef.current?.contains(t)) return;
      onCancel();
    };
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => document.removeEventListener('pointerdown', onPointerDown, true);
  }, [onCancel]);

  return (
    <form
      action={action}
      className={PHASE_CREATE_ROW_OUTER}
      ref={formRef}
    >
      <PhaseCreateSubmitPlus disabled={!hasText} hasAccent={hasText} />
      <label className="sr-only" htmlFor="phase-create-sidebar">
        Phase name
      </label>
      <input
        autoComplete="off"
        className={PHASE_CREATE_INPUT_CLASS}
        id="phase-create-sidebar"
        name="label"
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.preventDefault();
            onCancel();
          }
        }}
        placeholder="Phase name"
        ref={inputRef}
        type="text"
        value={value}
      />
    </form>
  );
}

export function PhaseCreateSidebarRow({
  projectId,
  projectSlug,
}: {
  projectId: string;
  projectSlug: string;
}) {
  const router = useRouter();
  const [state, action] = useActionState(createPhase.bind(null, projectId), undefined as CreatePhaseState | undefined);
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const prevStateRef = useRef<CreatePhaseState | undefined>(undefined);

  useEffect(() => {
    if (state === prevStateRef.current) return;
    prevStateRef.current = state;
    if (!state) return;
    if ('error' in state && state.error) {
      toast.error(state.error);
      return;
    }
    if ('success' in state && state.success) {
      toast.success('Phase created.');
      setEditing(false);
      setValue('');
      router.replace(`/app/projects/${projectSlug}?phase=${encodeURIComponent(state.phaseId)}`);
    }
  }, [state, projectSlug, router]);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
    }
  }, [editing]);

  const hasText = value.trim().length > 0;
  const cancel = useCallback(() => {
    setEditing(false);
    setValue('');
  }, []);

  if (!editing) {
    return <PhaseCreateIdleRow onStart={() => setEditing(true)} />;
  }

  return (
    <PhaseCreateEditingForm
      action={action}
      hasText={hasText}
      inputRef={inputRef}
      onCancel={cancel}
      onChange={setValue}
      value={value}
    />
  );
}
