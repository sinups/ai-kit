import { isRecord } from './parts';

const CLOSERS: Record<string, string> = { '{': '}', '[': ']' };

type Scan = {
  stack: string[];
  inString: boolean;
  escaped: boolean;
  stringStart: number;
  tailStart: number;
  lastDelimiter: string;
};

function scan(text: string): Scan {
  const stack: string[] = [];
  let inString = false;
  let escaped = false;
  let stringStart = -1;
  let tailStart = 0;
  let lastDelimiter = '';

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]!;
    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === '\\') {
        escaped = true;
        continue;
      }
      if (char === '"') {
        inString = false;
        tailStart = i + 1;
      }
      continue;
    }
    if (char === '"') {
      inString = true;
      stringStart = i;
      continue;
    }
    if (char === '{' || char === '[') {
      stack.push(char);
      lastDelimiter = char;
      tailStart = i + 1;
      continue;
    }
    if (char === '}' || char === ']') {
      stack.pop();
      lastDelimiter = char;
      tailStart = i + 1;
      continue;
    }
    if (char === ',' || char === ':') {
      lastDelimiter = char;
      tailStart = i + 1;
    }
  }

  return { stack, inString, escaped, stringStart, tailStart, lastDelimiter };
}

function isCompleteScalar(tail: string): boolean {
  return (
    tail === 'true' ||
    tail === 'false' ||
    tail === 'null' ||
    /^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(tail)
  );
}

function dropDanglingEntry(text: string): string {
  const body = text
    .replace(/\s+$/, '')
    .replace(/,?\s*"(?:[^"\\]|\\.)*"\s*:$/, '')
    .replace(/[,:]$/, '');
  return body.replace(/\s+$/, '');
}

function repair(text: string): string | null {
  const { stack, inString, escaped, stringStart, tailStart, lastDelimiter } = scan(text);
  if (stack.length === 0) {
    return null;
  }

  let body = text;
  if (inString) {
    const insideArray = stack[stack.length - 1] === '[';
    const isValue =
      lastDelimiter === ':' || (insideArray && (lastDelimiter === '[' || lastDelimiter === ','));
    if (isValue) {
      body = `${escaped ? text.slice(0, -1) : text}"`;
    } else {
      body = text.slice(0, stringStart);
    }
  } else {
    const tail = text.slice(tailStart).trim();
    if (tail && !isCompleteScalar(tail)) {
      body = text.slice(0, tailStart);
    }
  }

  body = dropDanglingEntry(body);
  while (stack.length > 1 && /,?\s*\{$/.test(body)) {
    body = dropDanglingEntry(body.replace(/,?\s*\{$/, ''));
    stack.pop();
  }
  for (let i = stack.length - 1; i >= 0; i -= 1) {
    body += CLOSERS[stack[i]!];
  }
  return body;
}

/**
 * Parses JSON that may still be streaming: an unfinished object or array keeps the entries it
 * already has, the truncated one is dropped. Returns `undefined` when nothing can be recovered.
 */
export function parsePartialJson(text: string): unknown {
  if (typeof text !== 'string') {
    return undefined;
  }
  const trimmed = text.trim();
  if (!trimmed) {
    return undefined;
  }
  try {
    return JSON.parse(trimmed);
  } catch {
    // falls through to the repair pass below
  }
  const repaired = repair(trimmed);
  if (repaired === null) {
    return undefined;
  }
  try {
    return JSON.parse(repaired);
  } catch {
    return undefined;
  }
}

/** Parses a value that may be a JSON object or array in string form, complete or still streaming */
export function parsePartialRecord(value: unknown): Record<string, any> | undefined {
  if (isRecord(value)) {
    return value;
  }
  if (typeof value !== 'string') {
    return undefined;
  }
  const parsed = parsePartialJson(value);
  return isRecord(parsed) ? parsed : undefined;
}
