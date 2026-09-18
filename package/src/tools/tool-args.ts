import type { JsonSchema } from '../primitives/SchemaView/schema';
import type { ToolPart } from '../types';
import { clipText, formatOutputValue } from '../rows/tool-output';
import { isRecord } from '../utils/parts';
import type { ToolCallState } from './tool-call-state';

const MAX_FIELDS = 3;
const MAX_VALUE_CHARS = 40;

export type ToolArgsContext = {
  /** Visible state of the call, see `deriveToolCallState` */
  state: ToolCallState;
  /** Arguments of the call as the tool received them */
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
 * Arguments with every string argument that holds a JSON object replaced by its fields.
 * @deprecated The kit reads arguments by the `inputSchema` of the tool and no longer unfolds
 * strings: a string argument is a string. Unfold them yourself in `toolArgs` if a server needs it.
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

/** Arguments of a call as the tool received them, an empty record for anything but an object */
export function readToolArgs(input: unknown): Record<string, unknown> {
  return isRecord(input) ? input : {};
}

function isEmpty(value: unknown): boolean {
  if (value === undefined || value === null || value === '' || value === false) {
    return true;
  }
  if (Array.isArray(value)) {
    return value.length === 0;
  }
  return isRecord(value) && Object.keys(value).length === 0;
}

function formatArgValue(value: unknown, schema: JsonSchema | undefined, locale?: string): string {
  if (Array.isArray(value)) {
    return value
      .filter((item) => !isEmpty(item))
      .map((item) => formatArgValue(item, schema?.items, locale))
      .filter(Boolean)
      .join(', ');
  }
  if (isRecord(value)) {
    return clipText(JSON.stringify(value), MAX_VALUE_CHARS);
  }
  return clipText(formatOutputValue(value, locale, schema), MAX_VALUE_CHARS);
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
  /** Input schema of the tool: order, titles and value formats of the arguments come from it */
  schema?: JsonSchema;
  locale?: string;
};

/**
 * A few arguments as `title: value · title: value`, in the order and with the titles of the input
 * schema: required first, empty values and `false` flags skipped, a `true` flag shows its title alone.
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
    if (isEmpty(value)) {
      continue;
    }
    const property = schema?.properties?.[key];
    const title = property?.title ?? key;
    if (value === true) {
      fields.push(title);
      continue;
    }
    const text = formatArgValue(value, property, locale);
    if (text) {
      fields.push(`${title}: ${text}`);
    }
  }
  return fields.join(' · ');
}
