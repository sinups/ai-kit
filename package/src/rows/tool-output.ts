import type React from 'react';
import type { ToolPart } from '../types';
import type { ToolCallState } from '../tools/tool-call-state';
import { isRecord } from '../utils/parts';

const MAX_VALUE_CHARS = 80;
const SUMMARY_LINES = 3;
const TITLE_KEYS = ['title', 'name', 'heading', 'label', 'summary', 'subject', 'text'];
const ID_KEYS = ['key', 'code', 'number', 'identifier', 'displayId', 'taskKey', 'slug', 'id'];
export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** Longest result the opened details of a row render */
export const MAX_OUTPUT_CHARS = 3000;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}|$)/;

export interface ToolOutputLabels {
  /** Header of a list result, `12 items` by default */
  items: (count: number) => string;
  /** Result of a call that found nothing, `Nothing found` by default */
  empty: string;
  /** Tail of a list shown in part, `3 more` by default */
  more: (count: number) => string;
}

export const DEFAULT_TOOL_OUTPUT_LABELS: ToolOutputLabels = {
  items: (count) => `${count} ${count === 1 ? 'item' : 'items'}`,
  empty: 'Nothing found',
  more: (count) => `${count} more`,
};

export type ToolOutputContext = {
  /** Visible state of the call, see `deriveToolCallState` */
  state: ToolCallState;
  /** Raw output of the call, `errorText` for a failure */
  output: unknown;
  /** Text the kit shows without a formatter */
  summary: string;
  /** Locale of numbers and dates, the locale of the runtime by default */
  locale?: string;
  /** Labels in use, already merged with the defaults */
  labels: ToolOutputLabels;
};

/** Reads the result of one call; `null` falls back to the default summary of the kit */
export type ToolOutputFormatter = (
  part: ToolPart,
  ctx: ToolOutputContext
) => React.ReactNode | string | null;

/**
 * Formatters by part type, as `toolRenderers` are keyed: `tool-Read`,
 * `tool-mcp__tracker__task_list`, or a server-wide `tool-mcp__tracker__*`.
 */
export type ToolOutputFormatters = Record<string, ToolOutputFormatter>;

/** Entry for a part type: the exact key first, then the longest matching `…*` key */
export function resolveByPartType<T>(
  entries: Record<string, T | undefined> | undefined,
  partType: string
): T | undefined {
  if (!entries) {
    return undefined;
  }
  const exact = entries[partType];
  if (exact) {
    return exact;
  }
  let matched: { prefix: string; entry: T } | undefined;
  for (const [key, entry] of Object.entries(entries)) {
    if (!key.endsWith('*') || !entry) {
      continue;
    }
    const prefix = key.slice(0, -1);
    if (partType.startsWith(prefix) && (!matched || prefix.length > matched.prefix.length)) {
      matched = { prefix, entry };
    }
  }
  return matched?.entry;
}

/** The text cut to `max` characters with an ellipsis */
export function clipText(text: string, max = MAX_VALUE_CHARS): string {
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
}

/** One value of a result in the language of the reader: numbers and dates by locale, rest clipped */
export function formatOutputValue(value: unknown, locale?: string): string {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return new Intl.NumberFormat(locale).format(value);
  }
  if (typeof value === 'boolean') {
    return String(value);
  }
  if (typeof value === 'string') {
    if (ISO_DATE.test(value)) {
      const date = new Date(value);
      if (!Number.isNaN(date.getTime())) {
        return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(date);
      }
    }
    return clipText(value);
  }
  if (value === null || value === undefined) {
    return '';
  }
  return clipText(JSON.stringify(value));
}

function pickKey(
  item: Record<string, unknown>,
  keys: string[],
  locale?: string
): string | undefined {
  for (const key of keys) {
    const value = item[key];
    if (typeof value === 'string' && value.trim() && !UUID.test(value)) {
      return formatOutputValue(value, locale);
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
      return formatOutputValue(value, locale);
    }
  }
  return undefined;
}

const LIST_KEYS = ['content', 'items', 'results', 'data', 'records', 'nodes', 'rows', 'entries'];
const TOTAL_KEYS = ['total', 'totalCount', 'totalElements', 'count'];
const RECORD_PAIRS = 3;

export function describeItem(item: unknown, locale?: string): string {
  if (isRecord(item)) {
    const title = pickKey(item, TITLE_KEYS, locale);
    const id = pickKey(item, ID_KEYS, locale);
    if (title && id) {
      return `${id} · ${title}`;
    }
    if (title || id) {
      return (title ?? id)!;
    }
    return describePairs(item, locale);
  }
  return formatOutputValue(item, locale);
}

/** A record without a title as its first few facts: `name: value`, collections by their size */
function describePairs(record: Record<string, unknown>, locale?: string): string {
  const pairs: string[] = [];
  for (const [key, value] of Object.entries(record)) {
    if (pairs.length >= RECORD_PAIRS) {
      break;
    }
    if (Array.isArray(value)) {
      pairs.push(`${key}: ${formatOutputValue(value.length, locale)}`);
    } else if (isRecord(value)) {
      const title = pickKey(value, TITLE_KEYS, locale);
      if (title) {
        pairs.push(`${key}: ${title}`);
      }
    } else if (
      value !== null &&
      value !== undefined &&
      value !== '' &&
      !(typeof value === 'string' && UUID.test(value))
    ) {
      pairs.push(`${key}: ${formatOutputValue(value, locale)}`);
    }
  }
  return pairs.join(' · ');
}

function parseJsonContainer(text: string): unknown {
  const trimmed = text.trim();
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
    return undefined;
  }
  try {
    const parsed: unknown = JSON.parse(trimmed);
    return typeof parsed === 'object' && parsed !== null ? parsed : undefined;
  } catch {
    return undefined;
  }
}

/** Text of MCP content blocks `[{ type: 'text', text }]`, `undefined` for any other array */
function readContentBlocks(blocks: unknown[]): string | undefined {
  const texts = blocks
    .filter((block) => isRecord(block) && block.type === 'text' && typeof block.text === 'string')
    .map((block) => (block as { text: string }).text);
  return texts.length > 0 ? texts.join('') : undefined;
}

function readMcpText(output: unknown): string | undefined {
  if (Array.isArray(output)) {
    return readContentBlocks(output);
  }
  if (!isRecord(output)) {
    return undefined;
  }
  if (Array.isArray(output.content)) {
    return readContentBlocks(output.content);
  }
  return output.type === 'text' && typeof output.text === 'string' ? output.text : undefined;
}

/**
 * Result of a call as data: MCP content blocks — `{ content: [...] }`, a bare array of blocks or
 * one block — become their text, and text that holds JSON becomes the structure it describes.
 */
export function unwrapToolOutput(output: unknown): unknown {
  const text = typeof output === 'string' ? output : readMcpText(output);
  if (text === undefined) {
    return output;
  }
  return parseJsonContainer(text) ?? text;
}

/** The collection a result is about: the array itself, or the one array inside a page or envelope */
export function findList(output: unknown): unknown[] | undefined {
  if (Array.isArray(output)) {
    return output;
  }
  if (!isRecord(output)) {
    return undefined;
  }
  const arrays = Object.entries(output).filter((entry): entry is [string, unknown[]] =>
    Array.isArray(entry[1])
  );
  if (arrays.length === 1) {
    return arrays[0][1];
  }
  const listed = arrays.filter(([key]) => LIST_KEYS.includes(key));
  return listed.length === 1 ? listed[0][1] : undefined;
}

export function readTotal(output: unknown): number | undefined {
  if (!isRecord(output)) {
    return undefined;
  }
  for (const key of TOTAL_KEYS) {
    const value = output[key];
    if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
      return value;
    }
  }
  return undefined;
}

/** Whether the result is a collection the summary counts, alone or inside a page */
export function isListOutput(output: unknown): boolean {
  return findList(unwrapToolOutput(output)) !== undefined;
}

export type SummarizeOptions = {
  locale?: string;
  labels?: ToolOutputLabels;
};

/**
 * Result of a call as a few readable lines: a list — also inside a page such as
 * `{ content: [...], page, hasMore }` — becomes its size and first entries, a record becomes one
 * line of its facts, text stays text. Anything the rules do not cover falls back to pretty JSON.
 */
export function summarizeToolOutput(output: unknown, options: SummarizeOptions = {}): string {
  const labels = options.labels ?? DEFAULT_TOOL_OUTPUT_LABELS;
  const { locale } = options;
  const value = unwrapToolOutput(output);

  if (value === undefined || value === null) {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return formatOutputValue(value, locale);
  }

  const list = findList(value);
  if (list) {
    if (list.length === 0) {
      return labels.empty;
    }
    const total = readTotal(value) ?? list.length;
    const shown = list.slice(0, SUMMARY_LINES - 1);
    const lines = shown.map((item) => describeItem(item, locale)).filter(Boolean);
    const rest = total - shown.length;
    return [labels.items(total), ...lines, ...(rest > 0 ? [labels.more(rest)] : [])].join('\n');
  }

  if (isRecord(value)) {
    const { stdout, text, message } = value;
    for (const candidate of [stdout, text, message]) {
      if (typeof candidate === 'string' && candidate.trim()) {
        return candidate;
      }
    }
    const described = describeItem(value, locale);
    if (described) {
      return described;
    }
  }

  return JSON.stringify(value, null, 2);
}

/**
 * Output of a call as data: `errorText` for a failure; JSON that an MCP server sent as text is
 * parsed, so the result can be read and opened as a structure.
 */
export function getToolOutputValue(part: ToolPart): unknown {
  if (part.state === 'output-error' && typeof part.errorText === 'string') {
    return part.errorText;
  }
  return unwrapToolOutput(part.output ?? part.result);
}
