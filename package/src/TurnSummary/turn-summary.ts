import { formatDuration, type DurationUnits } from '../utils/format-elapsed';
import { formatTokens } from '../utils/format-tokens';

export type TurnSummaryLabels = {
  worked: (duration: string) => string;
  tokens: (used: string, budget?: string) => string;
  backgroundTasks: (count: number) => string;
};

export const DEFAULT_TURN_SUMMARY_LABELS: TurnSummaryLabels = {
  worked: (duration) => `Took ${duration}`,
  tokens: (used, budget) => (budget ? `${used} / ${budget}` : `${used} tokens`),
  backgroundTasks: (count) => `${count} ${count === 1 ? 'task' : 'tasks'} left running`,
};

export function getTurnSummarySegments(
  summary: { durationMs: number; tokens?: number; tokenBudget?: number; backgroundTasks?: number },
  labels: TurnSummaryLabels = DEFAULT_TURN_SUMMARY_LABELS,
  units?: Partial<DurationUnits>
): string[] {
  const segments = [labels.worked(formatDuration(summary.durationMs, units))];
  if (summary.tokens !== undefined) {
    segments.push(
      labels.tokens(
        formatTokens(summary.tokens),
        summary.tokenBudget ? formatTokens(summary.tokenBudget) : undefined
      )
    );
  }
  if (summary.backgroundTasks) {
    segments.push(labels.backgroundTasks(summary.backgroundTasks));
  }
  return segments;
}
