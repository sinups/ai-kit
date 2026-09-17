import type { DailyUsage, UsageLimit } from './types';

export type UsageLevel = 'normal' | 'warning' | 'danger';

export function getUsageLevel(
  used: number,
  limit: number,
  warnAt = 0.75,
  dangerAt = 0.9
): UsageLevel {
  const ratio = getRatio(used, limit);
  if (ratio >= dangerAt) {
    return 'danger';
  }
  return ratio >= warnAt ? 'warning' : 'normal';
}

export function getRatio(value: number, total: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(total) || total <= 0) {
    return 0;
  }
  return Math.min(1, Math.max(0, value / total));
}

/** Percentages of each value relative to the largest one, for bars that fill the row with the top item */
export function getRelativePercents(values: number[]): number[] {
  const max = Math.max(0, ...values);
  return values.map((value) => (max > 0 ? Math.round((Math.max(0, value) / max) * 1000) / 10 : 0));
}

export function formatCost(value: number, currency = 'USD', locale = 'en-US'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatLimitValue(
  value: number,
  unit: UsageLimit['unit'],
  currency?: string,
  locale = 'en-US'
) {
  if (unit === 'cost') {
    return formatCost(value, currency, locale);
  }
  return new Intl.NumberFormat(locale, {
    notation: value >= 10_000 ? 'compact' : 'standard',
    maximumFractionDigits: 1,
  }).format(value);
}

type DurationUnit = 'day' | 'hour' | 'minute';

function formatUnit(value: number, unit: DurationUnit, locale: string) {
  return new Intl.NumberFormat(locale, { style: 'unit', unit, unitDisplay: 'narrow' }).format(
    value
  );
}

/** `Resets in 2h 15m`-style duration until `resetsAt`, `null` when unknown or already passed */
export function formatResetIn(
  resetsAt: Date | string | undefined,
  now: Date = new Date(),
  locale = 'en-US'
) {
  if (!resetsAt) {
    return null;
  }
  const target = resetsAt instanceof Date ? resetsAt : new Date(resetsAt);
  const minutes = Math.ceil((target.getTime() - now.getTime()) / 60_000);
  if (!Number.isFinite(minutes) || minutes <= 0) {
    return null;
  }
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const rest = minutes % 60;
  let parts: [number, DurationUnit][] = [[rest, 'minute']];
  if (days > 0) {
    parts = [
      [days, 'day'],
      [hours, 'hour'],
    ];
  } else if (hours > 0) {
    parts = [
      [hours, 'hour'],
      [rest, 'minute'],
    ];
  }
  return parts
    .filter(([amount], index) => index === 0 || amount > 0)
    .map(([amount, unit]) => formatUnit(amount, unit, locale))
    .join(' ');
}

export function formatUsageDay(date: Date | string, locale = 'en-US'): string {
  const value = date instanceof Date ? date : new Date(date);
  return Number.isNaN(value.getTime())
    ? String(date)
    : new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }).format(value);
}

/** Days sorted from oldest to newest */
export function sortDailyUsage(days: DailyUsage[]): DailyUsage[] {
  const time = (day: DailyUsage) => new Date(day.date).getTime();
  return [...days].sort((a, b) => time(a) - time(b));
}
