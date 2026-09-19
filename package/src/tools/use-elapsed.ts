import { useRef } from 'react';
import type { ToolPart } from '../types';
import { useAnimationTime } from '../hooks/use-animation-clock';
import { useChatLabels } from '../labels/chat-labels';
import { formatElapsedTime } from '../utils/format-elapsed';
import { getPartOutput } from '../utils/format-tool';

type ReportedTiming = { startedAt?: unknown; durationMs?: unknown; endedAt?: unknown };

function readCustomTiming(part: ToolPart): ReportedTiming {
  const meta = part.callProviderMetadata as { custom?: ReportedTiming } | undefined;
  return meta?.custom ?? {};
}

function asTime(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function asDuration(value: unknown): number | undefined {
  const time = asTime(value);
  return time !== undefined && time > 0 ? time : undefined;
}

/** Start of a call as the host reports it: `callProviderMetadata.custom.startedAt` or `startedAt` */
export function getReportedStart(part: ToolPart): number | undefined {
  return asTime(readCustomTiming(part).startedAt ?? part.startedAt);
}

/**
 * Duration of a finished call as the host reports it, in this order: `totalDurationMs`, `duration`
 * or `duration_ms` of the output, then `callProviderMetadata.custom.durationMs`, then
 * `callProviderMetadata.custom.endedAt` minus the reported start. The metadata serves parts whose
 * output is text, such as a thought.
 */
export function getReportedDuration(part: ToolPart): number | undefined {
  const output = getPartOutput(part);
  const custom = readCustomTiming(part);
  const start = getReportedStart(part);
  const endedAt = asTime(custom.endedAt);
  return (
    asDuration(output?.totalDurationMs || output?.duration || output?.duration_ms) ??
    asDuration(custom.durationMs) ??
    (endedAt !== undefined && start !== undefined ? asDuration(endedAt - start) : undefined)
  );
}

/**
 * Time a run of finished calls took by the reports of the host: from the first start to the last
 * end of the calls that report both, else the sum of the reported durations; `undefined` without
 * any report.
 */
export function getReportedRunDuration(parts: ToolPart[]): number | undefined {
  let first = Infinity;
  let last = -Infinity;
  let total = 0;
  let reported = false;
  for (const part of parts) {
    const duration = getReportedDuration(part);
    if (duration === undefined) {
      continue;
    }
    reported = true;
    total += duration;
    const start = getReportedStart(part);
    if (start !== undefined) {
      first = Math.min(first, start);
      last = Math.max(last, start + duration);
    }
  }
  if (!reported) {
    return undefined;
  }
  return last > first ? last - first : total;
}

/**
 * Formatted elapsed time of a long-running tool part: ticks every second while pending,
 * then switches to the duration the host reports when available, see `getReportedDuration`. A host that reports no
 * start time gets the moment the call was first rendered as running, so the row never stands still.
 */
export function useElapsed(part: ToolPart, isPending: boolean): string {
  const reportedAt = getReportedStart(part);
  const firstSeenAtRef = useRef<number | undefined>(undefined);
  if (!isPending) {
    firstSeenAtRef.current = undefined;
  } else if (reportedAt === undefined && firstSeenAtRef.current === undefined) {
    firstSeenAtRef.current = Date.now();
  }
  const startedAt = reportedAt ?? firstSeenAtRef.current;
  const outputDuration = getReportedDuration(part);

  const now = useAnimationTime({
    intervalMs: 1000,
    active: Boolean(isPending && startedAt),
    respectReducedMotion: false,
  });
  const elapsedMs = isPending && startedAt ? Math.max(0, now - startedAt) : 0;

  const units = useChatLabels('durationUnits');
  return formatElapsedTime(!isPending && outputDuration ? outputDuration : elapsedMs, units);
}
