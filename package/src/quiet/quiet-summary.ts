import type { ToolPart } from '../types';
import type { ToolCallState } from '../tools/tool-call-state';
import {
  clipText,
  describeItem,
  findList,
  getToolOutputValue,
  readTotal,
  summarizeToolOutput,
  unwrapToolOutput,
  type ToolOutputLabels,
} from '../rows/tool-output';
import { isRecord } from '../utils/parts';

const MAX_DETAIL_ITEMS = 50;
const LIST_ITEM = /^\s*(?:[-*+]|\d+[.)])\s+/;

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

/** Result a quiet row reads: an envelope of one text field such as `{ result }` gives its text */
export function readQuietResult(part: ToolPart): unknown {
  const value = getToolOutputValue(part);
  if (isRecord(value)) {
    const entries = Object.entries(value);
    if (entries.length === 1 && typeof entries[0][1] === 'string') {
      return unwrapToolOutput(entries[0][1]);
    }
  }
  return value;
}

/** Items of a markdown list in a text result, empty when the text is not a list */
export function readMarkdownList(text: string): string[] {
  const items = text.split('\n').filter((line) => LIST_ITEM.test(line));
  return items.length >= 2 ? items : [];
}

/**
 * The one line a finished call leaves in the transcript: the size of a list, the first line of a
 * text, the state of a refused or failed call. Everything else stays in the opened details.
 */
export function summarizeQuietResult(
  part: ToolPart,
  state: ToolCallState,
  labels: QuietSummaryLabels
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
  if (state === 'error') {
    const reason = firstLine(readErrorReason(getToolOutputValue(part)));
    return reason ? `${labels.failed} · ${reason}` : labels.failed;
  }
  if (state !== 'done') {
    return '';
  }
  const value = readQuietResult(part);
  if (typeof value === 'string') {
    const list = readMarkdownList(value);
    return list.length > 0 ? labels.items(list.length) : firstLine(value);
  }
  return firstLine(summarizeToolOutput(value, { labels }));
}

/** Entries of a list result as lines, for the opened details */
export function describeQuietItems(value: unknown, locale?: string): string[] | undefined {
  const list = findList(value);
  if (!list) {
    return undefined;
  }
  const lines = list
    .slice(0, MAX_DETAIL_ITEMS)
    .map((item) => describeItem(item, locale))
    .filter(Boolean);
  const total = readTotal(value) ?? list.length;
  return total > lines.length ? [...lines, '…'] : lines;
}
