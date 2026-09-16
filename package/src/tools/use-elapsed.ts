import { useEffect, useState } from 'react';
import type { ToolPart } from '../types';
import { formatElapsedTime } from '../utils/format-elapsed';
import { getPartOutput } from '../utils/format-tool';

function getStartedAt(part: ToolPart): number | undefined {
  const meta = part.callProviderMetadata as { custom?: { startedAt?: number } } | undefined;
  return meta?.custom?.startedAt ?? (part.startedAt as number | undefined);
}

/**
 * Formatted elapsed time of a long-running tool part: ticks every second while pending,
 * then switches to the duration reported in the output when available.
 */
export function useElapsed(part: ToolPart, isPending: boolean): string {
  const [elapsedMs, setElapsedMs] = useState(0);
  const startedAt = getStartedAt(part);
  const output = getPartOutput(part);
  const outputDuration: number | undefined =
    output?.totalDurationMs || output?.duration || output?.duration_ms;

  useEffect(() => {
    if (isPending && startedAt) {
      setElapsedMs(Date.now() - startedAt);
      const interval = setInterval(() => {
        setElapsedMs(Date.now() - startedAt);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isPending, startedAt]);

  return formatElapsedTime(!isPending && outputDuration ? outputDuration : elapsedMs);
}
