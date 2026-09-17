import type { SessionDate } from './types';

const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const MONTH = 30 * DAY;
const YEAR = 365 * DAY;

export function toDate(value: SessionDate): Date {
  return value instanceof Date ? value : new Date(value);
}

export function formatRelativeTime(
  date: SessionDate,
  now: SessionDate = new Date(),
  locale = 'en'
): string {
  const seconds = (toDate(date).getTime() - toDate(now).getTime()) / 1000;
  const abs = Math.abs(seconds);
  const format = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  if (Number.isNaN(abs)) {
    return '';
  }
  if (abs < 45) {
    return format.format(0, 'second');
  }

  const units: [Intl.RelativeTimeFormatUnit, number, number][] = [
    ['minute', MINUTE, HOUR],
    ['hour', HOUR, DAY],
    ['day', DAY, WEEK],
    ['week', WEEK, 5 * WEEK],
    ['month', MONTH, YEAR],
  ];
  for (const [unit, size, limit] of units) {
    if (abs < limit) {
      return format.format(Math.trunc(seconds / size) || Math.sign(seconds), unit);
    }
  }
  return format.format(Math.trunc(seconds / YEAR), 'year');
}
