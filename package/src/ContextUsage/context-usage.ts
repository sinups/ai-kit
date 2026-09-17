export type ContextUsageLevel = 'normal' | 'warning' | 'danger';

export function getUsageRatio(used: number, total: number): number {
  if (!(total > 0)) {
    return 0;
  }
  return Math.min(1, Math.max(0, used / total));
}

export function getUsageLevel(ratio: number, warnAt = 0.8, dangerAt = 0.95): ContextUsageLevel {
  if (ratio >= dangerAt) {
    return 'danger';
  }
  if (ratio >= warnAt) {
    return 'warning';
  }
  return 'normal';
}

export function formatPercent(ratio: number): string {
  const percent = ratio * 100;
  if (percent > 0 && percent < 1) {
    return '<1%';
  }
  return `${Math.round(percent)}%`;
}
