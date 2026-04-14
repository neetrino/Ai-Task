import { updateProjectChatModel } from '@/features/projects/chat-model-actions';
import { OPENAI_CHAT_MODEL_SUGGESTIONS } from '@/shared/lib/openai-model';

type ProjectModelFields = {
  id: string;
  openaiChatModel: string | null;
};

export function ChatModelForm({
  project,
  envDefaultLabel,
}: {
  project: ProjectModelFields;
  /** Shown when project override is empty — from server env. */
  envDefaultLabel: string;
}) {
  const inputId = `openai-chat-model-${project.id}`;
  const listId = `${inputId}-datalist`;
  return (
    <form action={updateProjectChatModel.bind(null, project.id)} className="flex flex-col gap-3">
      <p className="text-sm text-slate-600">
        Per-project override. Leave empty to use server default:{' '}
        <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">{envDefaultLabel}</code>{' '}
        (<code className="text-xs">OPENAI_CHAT_MODEL</code>).
      </p>
      <label className="text-sm font-medium text-slate-700" htmlFor={inputId}>
        OpenAI model id
      </label>
      <input
        className="max-w-md rounded-md border border-slate-300 px-3 py-2 font-mono text-sm text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
        defaultValue={project.openaiChatModel ?? ''}
        id={inputId}
        list={listId}
        name="openaiChatModel"
        placeholder="Leave empty for env default"
        type="text"
      />
      <datalist id={listId}>
        {OPENAI_CHAT_MODEL_SUGGESTIONS.map((m) => (
          <option key={m} value={m} />
        ))}
      </datalist>
      <div className="flex justify-end">
        <button
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          type="submit"
        >
          Save model
        </button>
      </div>
    </form>
  );
}
