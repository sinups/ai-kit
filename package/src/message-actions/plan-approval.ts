import type { Plan } from '../tools/PlanTool';

export type PlanApproveOption = { value: string; label: string; description?: string };

/** File name shown in the plan header, same rule as `PlanTool`: `plan-<id>.md` */
export function getPlanFileName(plan: Pick<Plan, 'id'>): string {
  const rawId = plan.id?.trim();
  if (!rawId) {
    return 'plan-working.md';
  }
  return rawId.endsWith('.md') ? rawId : `plan-${rawId}.md`;
}

/** Height in px of the collapsed plan for a number of lines of body text */
export function getCollapsedPlanHeight(lines: number, lineHeight = 22): number {
  return Math.max(1, Math.round(lines)) * lineHeight;
}

/** Label of the approval mode picked from `options`, the raw mode when it is not listed */
export function getApproveModeLabel(
  options: readonly PlanApproveOption[] | undefined,
  mode: string | undefined
): string | undefined {
  if (!mode) {
    return undefined;
  }
  return options?.find((option) => option.value === mode)?.label ?? mode;
}
