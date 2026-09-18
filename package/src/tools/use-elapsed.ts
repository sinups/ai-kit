import { useRef } from 'react';
import type { ToolPart } from '../types';
import { useAnimationTime } from '../hooks/use-animation-clock';
import { formatElapsedTime } from '../utils/format-elapsed';
import { getPartOutput } from '../utils/format-tool';

function getStartedAt(part: ToolPart): number | undefined {
  const meta = part.callProviderMetadata as { custom?: { startedAt?: number } } | undefined;
  return meta?.custom?.startedAt ?? (part.startedAt as number | undefined);
}

/**
 * Formatted elapsed time of a long-running tool part: ticks every second while pending,
 * then switches to the duration reported in the output when available. A host that reports no
 * start time gets the moment the call was first rendered as running, so the row never stands still.
 */
export function useElapsed(part: ToolPart, isPending: boolean): string {
  const reportedAt = getStartedAt(part);
  const firstSeenAtRef = useRef<number | undefined>(undefined);
  if (!isPending) {
    firstSeenAtRef.current = undefined;
  } else if (reportedAt === undefined && firstSeenAtRef.current === undefined) {
    firstSeenAtRef.current = Date.now();
  }
  const startedAt = reportedAt ?? firstSeenAtRef.current;
  const output = getPartOutput(part);
  const outputDuration: number | undefined =
    output?.totalDurationMs || output?.duration || output?.duration_ms;

  const now = useAnimationTime({
    intervalMs: 1000,
    active: Boolean(isPending && startedAt),
    respectReducedMotion: false,
  });
  const elapsedMs = isPending && startedAt ? Math.max(0, now - startedAt) : 0;

  return formatElapsedTime(!isPending && outputDuration ? outputDuration : elapsedMs);
}
