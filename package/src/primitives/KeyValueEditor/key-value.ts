export type KeyValuePair = {
  /** Stable row id used as the React key */
  id: string;
  /** Variable or header name */
  key: string;
  /** Variable or header value */
  value: string;
  /** Masks the value */
  secret?: boolean;
};

export type KeyValueEntry = Omit<KeyValuePair, 'id'>;

export type KeyValidator = (key: string) => string | null;

export type KeyValueErrorLabels = {
  /** Error for a row that has a value but no key, `Key is required` by default */
  keyRequired: string;
  /** Error for a key that is already used above, `Duplicate key` by default */
  duplicateKey: string;
};

const ENV_KEY = /^[A-Za-z_][A-Za-z0-9_]*$/;
const HEADER_KEY = /^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/;

export const envKeyValidator: KeyValidator = (key) =>
  ENV_KEY.test(key) ? null : 'Use letters, digits and underscores, not starting with a digit';

export const headerKeyValidator: KeyValidator = (key) =>
  HEADER_KEY.test(key) ? null : 'Header names cannot contain spaces or separators';

let nextId = 0;

export function createKeyValuePair(entry: Partial<KeyValueEntry> = {}): KeyValuePair {
  nextId += 1;
  return { id: `kv-${nextId}`, key: '', value: '', ...entry };
}

function unquote(value: string): string {
  if (value.length >= 2) {
    const quote = value[0];
    if ((quote === '"' || quote === "'") && value[value.length - 1] === quote) {
      const inner = value.slice(1, -1);
      return quote === '"' ? inner.replace(/\\n/g, '\n').replace(/\\"/g, '"') : inner;
    }
  }
  return value;
}

function stripInlineComment(value: string): string {
  const quote = value[0];
  if (quote === '"' || quote === "'") {
    let close = value.indexOf(quote, 1);
    while (quote === '"' && close !== -1 && value[close - 1] === '\\') {
      close = value.indexOf(quote, close + 1);
    }
    if (close === -1) {
      return value;
    }
    const rest = value.slice(close + 1).trim();
    return rest === '' || rest.startsWith('#') ? value.slice(0, close + 1) : value;
  }
  const index = value.search(/\s#/);
  return index === -1 ? value : value.slice(0, index).trimEnd();
}

export function parseKeyValueText(text: string): KeyValueEntry[] {
  const entries: KeyValueEntry[] = [];
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim().replace(/^export\s+/, '');
    if (!line || line.startsWith('#')) {
      continue;
    }
    const separators = [line.indexOf('='), line.indexOf(':')].filter((index) => index > 0);
    const separator = separators.length ? Math.min(...separators) : -1;
    if (separator === -1) {
      entries.push({ key: line, value: '' });
      continue;
    }
    const key = line.slice(0, separator).trim();
    const value = unquote(stripInlineComment(line.slice(separator + 1).trim()));
    entries.push({ key, value });
  }
  return entries;
}

export function isKeyValueText(text: string): boolean {
  return /[\r\n=]|:\s/.test(text.trim());
}

export function validateKeyValuePairs(
  pairs: KeyValuePair[],
  validateKey: KeyValidator = envKeyValidator,
  labels: KeyValueErrorLabels = { keyRequired: 'Key is required', duplicateKey: 'Duplicate key' }
): Record<string, string> {
  const errors: Record<string, string> = {};
  const seen = new Set<string>();
  for (const pair of pairs) {
    const key = pair.key.trim();
    if (!key) {
      if (pair.value) {
        errors[pair.id] = labels.keyRequired;
      }
      continue;
    }
    const error = validateKey(key);
    if (error) {
      errors[pair.id] = error;
    } else if (seen.has(key)) {
      errors[pair.id] = labels.duplicateKey;
    }
    seen.add(key);
  }
  return errors;
}

export function expandPastedPairs(
  pairs: KeyValuePair[],
  rowId: string,
  text: string,
  maxRows = Infinity
): KeyValuePair[] {
  const entries = parseKeyValueText(text);
  const index = pairs.findIndex((pair) => pair.id === rowId);
  if (index === -1 || entries.length === 0) {
    return pairs;
  }
  const [first, ...rest] = entries;
  const room = Math.max(0, maxRows - pairs.length);
  const current = pairs[index];
  const inserted = rest.slice(0, room).map((entry) => createKeyValuePair(entry));
  return [
    ...pairs.slice(0, index),
    { ...current, key: first.key, value: first.value },
    ...inserted,
    ...pairs.slice(index + 1),
  ];
}
