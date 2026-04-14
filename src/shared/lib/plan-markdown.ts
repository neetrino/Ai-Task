import { DECOMPOSITION_LEVEL_DESCRIPTIONS, type PlanPayload } from '@/shared/domain/plan';

export function planToMarkdown(plan: PlanPayload, fileTitle: string): string {
  const lines: string[] = [`# ${fileTitle}`, ''];
  if (plan.project_title) {
    lines.push(`**Project:** ${plan.project_title}`, '');
  }
  lines.push(`**Mode:** ${plan.epic_mode}`, '');
  if (plan.decomposition_level) {
    lines.push(
      `**Decomposition:** ${plan.decomposition_level} — ${DECOMPOSITION_LEVEL_DESCRIPTIONS[plan.decomposition_level]}`,
      '',
    );
    if (plan.decomposition_estimate_note) {
      lines.push(`**Estimate (this scope):** ${plan.decomposition_estimate_note}`, '');
    }
  }
  for (const epic of plan.epics) {
    lines.push(`## ${epic.name}`, '');
    if (epic.description) {
      lines.push(epic.description, '');
    }
    for (const task of epic.tasks) {
      const sizeTag = task.size ? `[${task.size}] ` : '';
      lines.push(`- ${sizeTag}${task.title}`);
      if (task.description) {
        lines.push(`  - ${task.description}`);
      }
    }
    lines.push('');
  }
  return lines.join('\n').trimEnd() + '\n';
}
