import type React from 'react';
import type { JsonSchema } from '../primitives/SchemaView/schema';
import type { ToolPart } from '../types';
import type { ToolCallState } from '../tools/tool-call-state';
import { isRecord } from '../utils/parts';

const MAX_VALUE_CHARS = 80;
const SUMMARY_FIELDS = 3;
const SUMMARY_ITEMS = 2;
/** Longest result the opened details of a row render */
export const MAX_OUTPUT_CHARS = 3000;

/** Content block of an MCP tool result, see the `CallToolResult` of the MCP specification */
export type McpContentBlock =
  | { type: 'text'; text: string }
  | { type: 'image'; data: string; mimeType: string }
  | { type: 'audio'; data: string; mimeType: string }
  | {
      type: 'resource_link';
      uri: string;
      name: string;
      title?: string;
      description?: string;
      mimeType?: string;
    }
  | {
      type: 'resource';
      resource: { uri: string; mimeType?: string; text?: string; blob?: string };
    };

/** Result of an MCP tool call as the specification defines it */
export type CallToolResult = {
  content: McpContentBlock[];
  /** Structured result, matching the `outputSchema` of the tool */
  structuredContent?: unknown;
  /** The tool reported an error, `false` by default */
  isError?: boolean;
};

export interface ToolOutputLabels {
  /** Header of a result the output schema declares as an array, `12 items` by default */
  items: (count: number) => string;
  /** Result of an empty array, `Nothing found` by default */
  empty: string;
  /** Tail of an array shown in part, `3 more` by default */
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
  /**
   * Legacy value kept from 0.3: the text of MCP content, parsed when it holds JSON, `errorText` for
   * a failure; see `getToolOutputValue`. Prefer `result`.
   */
  output: unknown;
  /** The MCP `CallToolResult` of the call, when the output is one; the recommended input */
  result?: CallToolResult;
  /** Output schema of the tool from the catalog */
  schema?: JsonSchema;
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

const CONTENT_TYPES = new Set(['text', 'image', 'audio', 'resource_link', 'resource']);

function isResultContent(value: unknown): value is McpContentBlock {
  return isRecord(value) && typeof value.type === 'string' && CONTENT_TYPES.has(value.type);
}

/**
 * The output as an MCP `CallToolResult`: the result object itself, or the bare array of content
 * blocks some SDKs pass on; `null` for an output of another shape.
 */
export function readCallToolResult(output: unknown): CallToolResult | null {
  if (Array.isArray(output)) {
    return output.length > 0 && output.every(isResultContent) ? { content: output } : null;
  }
  if (isRecord(output) && Array.isArray(output.content) && output.content.every(isResultContent)) {
    return output as CallToolResult;
  }
  return null;
}

/** Text of the `text` blocks of a result, one block per line */
export function readResultText(result: CallToolResult): string {
  return result.content.flatMap((block) => (block.type === 'text' ? [block.text] : [])).join('\n');
}

function matchesSchema(value: unknown, schema: JsonSchema): boolean {
  const types = Array.isArray(schema.type) ? schema.type : schema.type ? [schema.type] : [];
  if (types.includes('array')) {
    return Array.isArray(value);
  }
  if (types.includes('object') || schema.properties) {
    return isRecord(value) && (schema.required ?? []).every((key) => Object.hasOwn(value, key));
  }
  return false;
}

/**
 * Structured result of a call: `structuredContent`, or, for a server that only serialized it into
 * the text as the specification recommends, that text parsed and checked against `schema`.
 */
export function readStructuredResult(result: CallToolResult, schema?: JsonSchema): unknown {
  if (result.structuredContent !== undefined) {
    return result.structuredContent;
  }
  if (!schema) {
    return undefined;
  }
  try {
    const parsed: unknown = JSON.parse(readResultText(result));
    return matchesSchema(parsed, schema) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Result of a call as the kit shows it: `structuredContent` of an MCP result, else the text of its
 * content; any other output as it is. Text is never parsed as JSON here.
 */
export function readOutputValue(output: unknown): unknown {
  const result = readCallToolResult(output);
  if (!result) {
    return output;
  }
  return result.structuredContent !== undefined ? result.structuredContent : readResultText(result);
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

function readLegacyText(output: unknown): string | undefined {
  const blocks = Array.isArray(output)
    ? output
    : isRecord(output) && Array.isArray(output.content)
      ? output.content
      : isRecord(output)
        ? [output]
        : undefined;
  const texts = (blocks ?? [])
    .filter((block) => isRecord(block) && block.type === 'text' && typeof block.text === 'string')
    .map((block) => (block as { text: string }).text);
  return texts.length > 0 ? texts.join('') : undefined;
}

/**
 * Result of a call as 0.3 read it, kept for existing renderers and formatters: the text of MCP
 * content blocks, parsed when it holds JSON. The kit itself reads results by the specification,
 * see `readCallToolResult` and `readStructuredResult`.
 */
export function unwrapToolOutput(output: unknown): unknown {
  const text = typeof output === 'string' ? output : readLegacyText(output);
  if (text === undefined) {
    return output;
  }
  return parseJsonContainer(text) ?? text;
}

/** One value in the language of the reader: numbers by locale, dates when the schema says so, rest clipped */
export function formatOutputValue(value: unknown, locale?: string, schema?: JsonSchema): string {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return new Intl.NumberFormat(locale).format(value);
  }
  if (typeof value === 'boolean') {
    return String(value);
  }
  if (typeof value === 'string') {
    if (schema?.format === 'date' || schema?.format === 'date-time') {
      const date = new Date(value);
      if (!Number.isNaN(date.getTime())) {
        return new Intl.DateTimeFormat(locale, {
          dateStyle: 'medium',
          ...(schema.format === 'date-time' ? { timeStyle: 'short' } : {}),
        }).format(date);
      }
    }
    return clipText(value);
  }
  if (value === null || value === undefined) {
    return '';
  }
  return clipText(JSON.stringify(value));
}

function isArraySchema(schema: JsonSchema | undefined): boolean {
  const type = schema?.type;
  return type === 'array' || (Array.isArray(type) && type.includes('array'));
}

/** Properties of an object schema in reading order: required first, then as the schema lists them */
function orderedProperties(schema: JsonSchema | undefined): Array<[string, JsonSchema]> {
  const properties = Object.entries(schema?.properties ?? {});
  const required = new Set(schema?.required ?? []);
  return [
    ...properties.filter(([key]) => required.has(key)),
    ...properties.filter(([key]) => !required.has(key)),
  ];
}

/** A record as its first facts, `title: value`, in the order and with the titles of its schema */
function describeRecord(
  record: Record<string, unknown>,
  schema: JsonSchema | undefined,
  options: Required<Pick<SummarizeOptions, 'labels'>> & SummarizeOptions,
  withKeys = true
): string {
  const required = new Set(schema?.required ?? []);
  const entries: Array<[string, unknown, JsonSchema | undefined]> = schema?.properties
    ? orderedProperties(schema)
        .filter(([key]) => withKeys || required.size === 0 || required.has(key))
        .map(([key, property]) => [key, record[key], property])
    : Object.entries(record).map(([key, value]) => [key, value, undefined]);
  const facts: string[] = [];
  for (const [key, value, property] of entries) {
    if (facts.length >= SUMMARY_FIELDS) {
      break;
    }
    if (value === undefined || value === null || value === '') {
      continue;
    }
    const text =
      Array.isArray(value) && isArraySchema(property)
        ? options.labels.items(value.length)
        : isRecord(value) || Array.isArray(value)
          ? ''
          : formatOutputValue(value, options.locale, property);
    if (text) {
      facts.push(withKeys ? `${property?.title ?? key}: ${text}` : text);
    }
  }
  return facts.join(' · ');
}

export type SummarizeOptions = {
  locale?: string;
  labels?: ToolOutputLabels;
  /** Output schema of the tool: array counts, property titles and date formats come from it */
  schema?: JsonSchema;
};

function summarizeStructured(
  value: unknown,
  options: Required<Pick<SummarizeOptions, 'labels'>> & SummarizeOptions
): string {
  const { schema, labels, locale } = options;
  if (Array.isArray(value) && isArraySchema(schema)) {
    if (value.length === 0) {
      return labels.empty;
    }
    const shown = value
      .slice(0, SUMMARY_ITEMS)
      .map((item) =>
        isRecord(item)
          ? describeRecord(item, schema?.items, options, false)
          : formatOutputValue(item, locale, schema?.items)
      );
    const rest = value.length - shown.length;
    return [
      labels.items(value.length),
      ...shown.filter(Boolean),
      ...(rest > 0 ? [labels.more(rest)] : []),
    ].join('\n');
  }
  if (isRecord(value)) {
    return describeRecord(value, schema, options) || clipText(JSON.stringify(value));
  }
  if (typeof value === 'string') {
    return value;
  }
  return formatOutputValue(value, locale, schema);
}

function describeResources(result: CallToolResult): string {
  return result.content
    .flatMap((block) => {
      if (block.type === 'resource_link') {
        return [block.title ?? block.name];
      }
      if (block.type === 'resource') {
        return [block.resource.uri];
      }
      return block.type === 'image' || block.type === 'audio' ? [block.mimeType] : [];
    })
    .join(', ');
}

/**
 * Result of a call as a few readable lines, only as far as the MCP result says it: `structuredContent`
 * by its output schema (an array counts only when the schema declares one), the text of an error,
 * the names of the resources and media it returned. A result of text alone has no summary; its text
 * shows when the call is opened.
 */
export function summarizeToolOutput(output: unknown, options: SummarizeOptions = {}): string {
  const resolved = { ...options, labels: options.labels ?? DEFAULT_TOOL_OUTPUT_LABELS };
  const result = readCallToolResult(output);
  if (!result) {
    return output === undefined || output === null ? '' : summarizeStructured(output, resolved);
  }
  const structured = readStructuredResult(result, options.schema);
  if (structured !== undefined) {
    return summarizeStructured(structured, resolved);
  }
  return result.isError === true ? readResultText(result) : describeResources(result);
}

/**
 * Output of a call as 0.3 read it, `errorText` for a failure, see `unwrapToolOutput`. Kept for
 * existing formatters; prefer `readCallToolResult` on `part.output`.
 */
export function getToolOutputValue(part: ToolPart): unknown {
  if (part.state === 'output-error' && typeof part.errorText === 'string') {
    return part.errorText;
  }
  return unwrapToolOutput(part.output ?? part.result);
}

/** Output of a call as the kit shows it, `errorText` for a failure, see `readOutputValue` */
export function readPartOutput(part: ToolPart): unknown {
  if (part.state === 'output-error' && typeof part.errorText === 'string') {
    return part.errorText;
  }
  return readOutputValue(part.output ?? part.result);
}
