import type { JsonSchema } from '../primitives/SchemaView/schema';
import type { ToolPart } from '../types';
import { clipText, formatOutputValue, UUID } from '../rows/tool-output';
import { isRecord } from '../utils/parts';
import type { ToolCallState } from './tool-call-state';

const MAX_FIELDS = 3;
const MAX_VALUE_CHARS = 40;

export type ToolArgsContext = {
  /** Visible state of the call, see `deriveToolCallState` */
  state: ToolCallState;
  /** Arguments with every string argument that holds a JSON object unfolded into its fields */
  args: Record<string, unknown>;
  /** Text the kit shows without a formatter */
  summary: string;
  /** Schema of the arguments from the tool catalog, when the host passed one */
  schema?: JsonSchema;
  /** Locale of numbers and dates, the locale of the runtime by default */
  locale?: string;
};

/** Reads the arguments of one call into a short line; `null` falls back to the kit summary */
export type ToolArgsFormatter = (part: ToolPart, ctx: ToolArgsContext) => string | null;

/** Argument formatters by part type, keyed as `toolRenderers`, `tool-mcp__tracker__*` allowed */
export type ToolArgsFormatters = Record<string, ToolArgsFormatter>;

function parseJsonObject(value: string): Record<string, unknown> | undefined {
  const trimmed = value.trim();
  if (!trimmed.startsWith('{')) {
    return undefined;
  }
  try {
    const parsed: unknown = JSON.parse(trimmed);
    return isRecord(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Arguments as the tool meant them: a string argument that holds a JSON object, as some servers
 * pass their whole payload, is replaced by its fields.
 */
export function unfoldToolArgs(input: unknown): Record<string, unknown> {
  const source = typeof input === 'string' ? parseJsonObject(input) : input;
  if (!isRecord(source)) {
    return {};
  }
  const args: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(source)) {
    const nested = typeof value === 'string' ? parseJsonObject(value) : undefined;
    if (nested) {
      Object.assign(args, nested);
    } else {
      args[key] = value;
    }
  }
  return args;
}

function isNoise(value: unknown): boolean {
  if (value === undefined || value === null || value === '' || value === false) {
    return true;
  }
  if (typeof value === 'string' && UUID.test(value)) {
    return true;
  }
  if (Array.isArray(value)) {
    return value.length === 0 || value.every(isNoise);
  }
  return isRecord(value) && Object.keys(value).length === 0;
}

function formatArgValue(value: unknown, locale?: string): string {
  if (Array.isArray(value)) {
    return value
      .filter((item) => !isNoise(item))
      .map((item) => formatArgValue(item, locale))
      .filter(Boolean)
      .join(', ');
  }
  if (isRecord(value)) {
    const first = Object.values(value).find(
      (item) => typeof item === 'string' || typeof item === 'number'
    );
    return first === undefined ? '' : formatArgValue(first, locale);
  }
  return clipText(formatOutputValue(value, locale), MAX_VALUE_CHARS);
}

function orderKeys(args: Record<string, unknown>, schema?: JsonSchema): string[] {
  const keys = Object.keys(args);
  const described = Object.keys(schema?.properties ?? {});
  if (described.length === 0) {
    return keys;
  }
  const required = new Set(schema?.required ?? []);
  const rank = (key: string) => {
    const index = described.indexOf(key);
    return (required.has(key) ? 0 : 1000) + (index === -1 ? 500 : index);
  };
  return [...keys].sort((a, b) => rank(a) - rank(b));
}

export type SummarizeArgsOptions = {
  schema?: JsonSchema;
  locale?: string;
};

/**
 * A few significant arguments as `key: value · key: value`: identifiers, empty values and
 * `false` flags are skipped, a `true` flag shows its name alone.
 */
export function summarizeToolArgs(
  args: Record<string, unknown>,
  { schema, locale }: SummarizeArgsOptions = {}
): string {
  const fields: string[] = [];
  for (const key of orderKeys(args, schema)) {
    if (fields.length >= MAX_FIELDS) {
      break;
    }
    const value = args[key];
    if (isNoise(value)) {
      continue;
    }
    if (value === true) {
      fields.push(key);
      continue;
    }
    const text = formatArgValue(value, locale);
    if (text) {
      fields.push(`${key}: ${text}`);
    }
  }
  return fields.join(' · ');
}
