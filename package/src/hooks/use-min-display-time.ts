import { useEffect, useRef, useState } from 'react';

export const DEFAULT_MIN_DISPLAY_MS = 600;

export interface UseMinDisplayTimeOptions {
  /** How long a value stays on screen before it can be replaced, `600` by default, `0` disables */
  minMs?: number;
  /** Identity of the value, the value itself by default */
  key?: unknown;
}

/**
 * Keeps `value` on screen for at least `minMs` before showing a newer one, so a tool that finishes
 * in a few frames does not flash a status nobody can read. Values that arrive during the wait are
 * dropped in favour of the latest one, and the first value is never delayed.
 */
export function useMinDisplayTime<T>(value: T, options: UseMinDisplayTimeOptions = {}): T {
  const { minMs = DEFAULT_MIN_DISPLAY_MS, key = value } = options;
  const [shown, setShown] = useState<{ value: T; key: unknown }>(() => ({ value, key }));
  const shownSinceRef = useRef(Date.now());
  const latestRef = useRef({ value, key });
  latestRef.current = { value, key };

  useEffect(() => {
    if (minMs <= 0 || Object.is(key, shown.key)) {
      return;
    }
    const waitMs = minMs - (Date.now() - shownSinceRef.current);
    if (waitMs <= 0) {
      shownSinceRef.current = Date.now();
      setShown(latestRef.current);
      return;
    }
    const timeout = setTimeout(() => {
      shownSinceRef.current = Date.now();
      setShown(latestRef.current);
    }, waitMs);
    return () => clearTimeout(timeout);
  }, [key, shown.key, minMs]);

  return minMs > 0 ? shown.value : value;
}
