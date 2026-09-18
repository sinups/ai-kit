import type { ToolPart } from '../types';
import type { ToolCallState } from '../tools/tool-call-state';
import type { JsonSchema } from '../primitives/SchemaView/schema';
import {
  clipText,
  readCallToolResult,
  readResultText,
  summarizeToolOutput,
  type ToolOutputLabels,
} from '../rows/tool-output';
import { isRecord } from '../utils/parts';

export interface QuietSummaryLabels extends ToolOutputLabels {
  /** Short state of a failed call, `Error` by default */
  failed: string;
  /** Short state of a refused call, `Skipped` by default */
  rejected: string;
  /** Short state of a call that has not started, `Queued` by default */
  queued: string;
  /** Short state of a call left without a result, `Interrupted` by default */
  interrupted: string;
}

/** Why a call failed, when its output says it in words: the text, `message` or `error` */
function readErrorReason(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }
  if (!isRecord(value)) {
    return '';
  }
  const { message, error } = value;
  if (typeof message === 'string') {
    return message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return isRecord(error) && typeof error.message === 'string' ? error.message : '';
}

function firstLine(text: string): string {
  const line = text
    .split('\n')
    .map((item) => item.replace(/^\s*(?:#+|>)\s*/, '').trim())
    .find(Boolean);
  return clipText(line ?? '');
}

/**
 * The one line a finished call leaves in the transcript, read from the MCP result: the summary of
 * its structured content or the first line of its text, the state of a refused or failed call.
 * Everything else stays in the opened details.
 */
export function summarizeQuietResult(
  part: ToolPart,
  state: ToolCallState,
  labels: QuietSummaryLabels,
  schema?: JsonSchema
): string {
  if (state === 'rejected') {
    return labels.rejected;
  }
  if (state === 'queued') {
    return labels.queued;
  }
  if (state === 'interrupted') {
    return labels.interrupted;
  }
  const output = part.output ?? part.result;
  const result = readCallToolResult(output);
  if (state === 'error') {
    const reason = firstLine(
      typeof part.errorText === 'string'
        ? part.errorText
        : result
          ? readResultText(result)
          : readErrorReason(output)
    );
    return reason ? `${labels.failed} · ${reason}` : labels.failed;
  }
  if (state !== 'done') {
    return '';
  }
  return firstLine(summarizeToolOutput(output, { labels, schema }));
}
