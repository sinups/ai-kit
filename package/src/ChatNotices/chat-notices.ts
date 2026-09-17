const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Coarse away duration: `45m`, `3h`, `2d`; under a minute is `1m` */
export function formatAwayDuration(ms: number): string {
  const safe = Math.max(0, ms);
  if (safe >= DAY) {
    return `${Math.floor(safe / DAY)}d`;
  }
  if (safe >= HOUR) {
    return `${Math.floor(safe / HOUR)}h`;
  }
  return `${Math.max(1, Math.floor(safe / MINUTE))}m`;
}

export function formatSpend(amount: number, currency = 'USD', locale = 'en'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
