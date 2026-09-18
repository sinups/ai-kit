import type { ToolCallProgress, ToolPart } from '../types';
import { isRecord } from '../utils/parts';

function toFiniteNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function readProgress(value: unknown): ToolCallProgress | undefined {
  if (!isRecord(value)) {
    return undefined;
  }
  const progress = toFiniteNumber(value.progress);
  if (progress === undefined) {
    return undefined;
  }
  const total = toFiniteNumber(value.total);
  const message = typeof value.message === 'string' ? value.message : undefined;
  const progressToken =
    typeof value.progressToken === 'string' || typeof value.progressToken === 'number'
      ? value.progressToken
      : undefined;
  return { progress, total, message, progressToken };
}

/**
 * Latest MCP `notifications/progress` of a call, read from `part.progress` or from the provider
 * metadata a host attaches instead. Nothing is shown when the server never reports progress.
 */
export function getToolProgress(part: ToolPart): ToolCallProgress | undefined {
  const meta = part.callProviderMetadata as { custom?: { progress?: unknown } } | undefined;
  return readProgress(part.progress) ?? readProgress(meta?.custom?.progress);
}

/** `45%` against a known total, `3` steps otherwise */
export function formatToolProgress(progress: ToolCallProgress): string {
  const ratio = getToolProgressRatio(progress);
  if (ratio === undefined) {
    return String(Math.round(progress.progress));
  }
  return `${Math.round(ratio * 100)}%`;
}

/** Share of the work done, `undefined` while the server reports no total */
export function getToolProgressRatio(progress: ToolCallProgress): number | undefined {
  if (progress.total === undefined || progress.total <= 0) {
    return undefined;
  }
  return Math.min(1, Math.max(0, progress.progress / progress.total));
}
