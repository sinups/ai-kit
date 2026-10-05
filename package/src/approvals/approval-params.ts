import type { JsonSchema } from '../primitives/SchemaView/schema';
import { formatOutputValue } from '../rows/tool-output';
import { isRecord } from '../utils/parts';

/** One line of the request: what the agent passes and under which name */
export type ApprovalParam = {
  /** Name of the argument as the reader sees it */
  label: string;
  /** Value of the argument, already formatted */
  value: string;
  /** Path the label was built from, `params.limit` */
  path: string;
};

export type ApprovalParamsOptions = {
  /** Input schema of the tool: gives the order and the titles of the arguments */
  schema?: JsonSchema;
  /** Locale of numbers and dates, the locale of the runtime by default */
  locale?: string;
  /** How deep nested objects are unfolded into their own lines, `2` by default */
  depth?: number;
  /** Longest value kept whole, `120` characters by default */
  maxValueChars?: number;
};

const DEFAULT_DEPTH = 2;
const DEFAULT_MAX_VALUE_CHARS = 120;
const LOOKS_LIKE_ANOTHER_TYPE = /^(\s*[-+]?\d[\d\s.,e+-]*|true|false|null|)$/i;

/** `org_uid` and `verifiedPaymentOnly` both read as words: `Org uid`, `Verified payment only` */
export function humanizeParamName(name: string): string {
  const words = name
    .replace(/([a-z\d])([A-Z])/g, '$1 $2')
    .replace(/[_\-.]+/g, ' ')
    .trim()
    .toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/**
 * A string is quoted only when it would otherwise read as something else: an id of digits stays
 * `"1106955086989844481"` while a word stays a word.
 */
function formatValue(
  value: unknown,
  schema: JsonSchema | undefined,
  options: Required<Pick<ApprovalParamsOptions, 'maxValueChars'>> & { locale?: string }
): string {
  if (Array.isArray(value)) {
    const items = value.map((item) => formatValue(item, schema?.items, options));
    return clip(items.join(', '), options.maxValueChars);
  }
  if (isRecord(value)) {
    return clip(JSON.stringify(value), options.maxValueChars);
  }
  if (typeof value === 'string') {
    const text = formatOutputValue(value, options.locale, schema);
    const quoted = LOOKS_LIKE_ANOTHER_TYPE.test(text) ? `"${text}"` : text;
    return clip(quoted, options.maxValueChars);
  }
  if (value === null) {
    return 'null';
  }
  return clip(formatOutputValue(value, options.locale, schema), options.maxValueChars);
}

function clip(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
}

function orderKeys(keys: string[], schema?: JsonSchema): string[] {
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

/**
 * Turns the arguments of a call into the lines of an approval request: nested objects are unfolded
 * into `Params limit`-style names, the order and the titles follow the input schema when there is
 * one, and arguments the tool was not given are left out.
 */
export function readApprovalParams(
  input: unknown,
  options: ApprovalParamsOptions = {}
): ApprovalParam[] {
  const {
    schema,
    locale,
    depth = DEFAULT_DEPTH,
    maxValueChars = DEFAULT_MAX_VALUE_CHARS,
  } = options;
  if (!isRecord(input)) {
    return [];
  }
  const params: ApprovalParam[] = [];
  const walk = (
    source: Record<string, unknown>,
    level: number,
    path: string,
    label: string,
    fieldSchema: JsonSchema | undefined
  ) => {
    for (const key of orderKeys(Object.keys(source), fieldSchema)) {
      const value = source[key];
      if (value === undefined) {
        continue;
      }
      const child = fieldSchema?.properties?.[key];
      const name = child?.title ?? humanizeParamName(key);
      const fullPath = path ? `${path}.${key}` : key;
      const fullLabel = label ? `${label} ${name.toLowerCase()}` : name;
      if (isRecord(value) && level < depth && Object.keys(value).length > 0) {
        walk(value, level + 1, fullPath, fullLabel, child);
        continue;
      }
      params.push({
        label: fullLabel,
        path: fullPath,
        value: formatValue(value, child, { locale, maxValueChars }),
      });
    }
  };
  walk(input, 1, '', '', schema);
  return params;
}
