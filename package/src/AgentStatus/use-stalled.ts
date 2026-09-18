import { useAnimationTime } from '../hooks/use-animation-clock';

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
  const startMs = toMs(startedAt);
  const activityMs = toMs(lastActivityAt) ?? startMs;
  const needsTick = startMs !== undefined || activityMs !== undefined;
  const now = useAnimationTime({
    intervalMs: 500,
    active: needsTick,
    respectReducedMotion: false,
  });

  const elapsedMs = startMs === undefined ? 0 : Math.max(0, now - startMs);
  const isStalled = !paused && activityMs !== undefined && now - activityMs > stallAfterMs;

  return { elapsedMs, isStalled };
}
