/** Suffixes of the duration parts: `{ seconds: 's' }` gives `45s`, `{ seconds: ' с' }` gives `45 с` */
export type DurationUnits = {
  hours: string;
  minutes: string;
  seconds: string;
  milliseconds: string;
};

export const DEFAULT_DURATION_UNITS: DurationUnits = {
  hours: 'h',
  minutes: 'm',
  seconds: 's',
  milliseconds: 'ms',
};

export function formatElapsedTime(ms: number, units?: Partial<DurationUnits>): string {
  if (ms < 1000) {
    return '';
  }
  return formatDuration(ms, units);
}

/** `1h 5m`, `2m 3s`, `45s`; under a second in milliseconds, `400ms` */
export function formatDuration(ms: number, units?: Partial<DurationUnits>): string {
  const {
    hours: h,
    minutes: m,
    seconds: s,
    milliseconds: msUnit,
  } = {
    ...DEFAULT_DURATION_UNITS,
    ...units,
  };
  const safe = Math.max(0, ms);
  const totalSeconds = Math.floor(safe / 1000);
  if (totalSeconds < 1) {
    return `${Math.round(safe)}${msUnit}`;
  }
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return minutes > 0 ? `${hours}${h} ${minutes}${m}` : `${hours}${h}`;
  }
  if (minutes > 0) {
    return seconds > 0 ? `${minutes}${m} ${seconds}${s}` : `${minutes}${m}`;
  }
  return `${seconds}${s}`;
}
