import type { ContextProfileId } from '@/features/chat/profiles';
import { getModelById } from '@/shared/lib/ai-models';

const PROFILE_LABEL: Record<ContextProfileId, string> = {
  lite: 'Lite',
  doc: 'Doc',
  plan: 'Plan',
};

function formatTokens(value: number): string {
  if (value < 1000) return `${value} tok`;
  return `${(value / 1000).toFixed(1)}k tok`;
}

/**
 * Tiny inline badge under each assistant message:
 *   "Lite · gpt-5-nano · 1.2k tok".
 * Hidden when no metadata was recorded (legacy rows).
 */
export function MessageMeta({
  modelId,
  contextProfile,
  tokensUsed,
}: {
  modelId: string | null;
  contextProfile: string | null;
  tokensUsed: number | null;
}) {
  if (!modelId && !contextProfile && tokensUsed == null) {
    return null;
  }
  const model = modelId ? getModelById(modelId) : null;
  const modelLabel = model?.label ?? modelId ?? '—';
  const profileLabel =
    contextProfile && contextProfile in PROFILE_LABEL
      ? PROFILE_LABEL[contextProfile as ContextProfileId]
      : contextProfile;

  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10px] text-neutral-500">
      {profileLabel ? (
        <span className="rounded-full border border-white/[0.06] bg-neutral-800/60 px-1.5 py-[1px] uppercase tracking-wide">
          {profileLabel}
        </span>
      ) : null}
      <span className="text-neutral-600">·</span>
      <span title={modelId ?? undefined}>{modelLabel}</span>
      {tokensUsed != null ? (
        <>
          <span className="text-neutral-600">·</span>
          <span>{formatTokens(tokensUsed)}</span>
        </>
      ) : null}
    </div>
  );
}
