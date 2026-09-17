import { useEffect, useState } from 'react';

function toMs(value: number | Date | undefined): number | undefined {
  if (value === undefined) {
    return undefined;
  }
  return value instanceof Date ? value.getTime() : value;
}

export interface UseStalledOptions {
  startedAt?: number | Date;
  lastActivityAt?: number | Date;
  stallAfterMs?: number;
  paused?: boolean;
}

export function useStalled({
  startedAt,
  lastActivityAt,
  stallAfterMs = 3000,
  paused = false,
}: UseStalledOptions) {
  const [now, setNow] = useState(() => Date.now());
  const startMs = toMs(startedAt);
  const activityMs = toMs(lastActivityAt) ?? startMs;
  const needsTick = startMs !== undefined || activityMs !== undefined;

  useEffect(() => {
    if (!needsTick) {
      return;
    }
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(id);
  }, [needsTick]);

  const elapsedMs = startMs === undefined ? 0 : Math.max(0, now - startMs);
  const isStalled = !paused && activityMs !== undefined && now - activityMs > stallAfterMs;

  return { elapsedMs, isStalled };
}
