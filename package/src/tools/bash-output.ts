import type { ToolPart } from '../types';
import { getPartInput, getPartOutput } from '../utils/format-tool';

export interface BashRunInfo {
  /** Output so far or final output: `outputTail` while streaming, otherwise stdout and stderr */
  output?: string;
  exitCode?: number;
  durationMs?: number;
  timeoutMs?: number;
  startedAt?: number;
  sizeBytes?: number;
}

function numberOrUndefined(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function textOrUndefined(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

/** Output and run metadata of a Bash tool part in any of the shapes agents report */
export function getBashRunInfo(part: ToolPart): BashRunInfo {
  const input = getPartInput(part);
  const raw = getPartOutput(part);
  const meta = part.callProviderMetadata as { custom?: { startedAt?: number } } | undefined;
  const info: BashRunInfo = {
    timeoutMs: numberOrUndefined(input.timeout),
    startedAt: numberOrUndefined(meta?.custom?.startedAt) ?? numberOrUndefined(part.startedAt),
  };

  if (typeof raw === 'string') {
    info.output = raw;
    return info;
  }
  if (!raw || typeof raw !== 'object') {
    return info;
  }

  const tail = textOrUndefined(raw.outputTail);
  const stdout = textOrUndefined(raw.stdout) ?? textOrUndefined(raw.output) ?? '';
  const stderr = textOrUndefined(raw.stderr) ?? '';
  const joined = [stdout, stderr].filter(Boolean).join(stdout && stderr ? '\n' : '');
  info.output = tail ?? (joined || undefined);
  info.exitCode = numberOrUndefined(raw.exitCode) ?? numberOrUndefined(raw.exit_code);
  info.durationMs =
    numberOrUndefined(raw.durationMs) ??
    numberOrUndefined(raw.duration_ms) ??
    numberOrUndefined(raw.duration);
  info.sizeBytes = numberOrUndefined(raw.outputBytes) ?? numberOrUndefined(raw.totalBytes);
  info.startedAt = info.startedAt ?? numberOrUndefined(raw.startedAt);
  return info;
}
