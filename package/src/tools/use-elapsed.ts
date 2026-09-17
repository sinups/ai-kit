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
 * then switches to the duration reported in the output when available.
 */
export function useElapsed(part: ToolPart, isPending: boolean): string {
  const startedAt = getStartedAt(part);
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
