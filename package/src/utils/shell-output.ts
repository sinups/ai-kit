import { roundCompact } from './format-tokens';

export interface TextLink {
  text: string;
  href?: string;
}

const URL_PATTERN = /https?:\/\/[^\s<>"'`]+/g;
const TRAILING_PUNCTUATION = '.,;:!?)]}';

function count(text: string, char: string): number {
  return text.split(char).length - 1;
}

function trimTrailingPunctuation(url: string): string {
  let end = url.length;
  while (end > 0 && TRAILING_PUNCTUATION.includes(url[end - 1])) {
    const head = url.slice(0, end);
    if (url[end - 1] === ')' && count(head, '(') >= count(head, ')')) {
      break;
    }
    end--;
  }
  return url.slice(0, end);
}

/** Splits text into plain parts and http(s) links, trailing punctuation stays outside the link */
export function splitLinks(text: string): TextLink[] {
  const out: TextLink[] = [];
  let cursor = 0;
  for (const match of text.matchAll(URL_PATTERN)) {
    const url = trimTrailingPunctuation(match[0]);
    if (match.index! > cursor) {
      out.push({ text: text.slice(cursor, match.index) });
    }
    out.push({ text: url, href: url });
    cursor = match.index! + url.length;
  }
  if (cursor < text.length) {
    out.push({ text: text.slice(cursor) });
  }
  return out;
}

/** Pretty-printed JSON when the whole output is a JSON object or array, `null` otherwise */
export function formatJsonOutput(text: string): string | null {
  const trimmed = text.trim();
  if (!/^[[{]/.test(trimmed) || !/[\]}]$/.test(trimmed)) {
    return null;
  }
  try {
    return JSON.stringify(JSON.parse(trimmed), null, 2);
  } catch {
    return null;
  }
}

/** Last `limit` lines and how many were hidden before them */
export function tailLines<T>(lines: T[], limit: number): { visible: T[]; hidden: number } {
  if (limit <= 0 || lines.length <= limit) {
    return { visible: lines, hidden: 0 };
  }
  return { visible: lines.slice(lines.length - limit), hidden: lines.length - limit };
}

/** UTF-8 size of the text in bytes */
export function byteLength(text: string): number {
  let bytes = 0;
  for (const char of text) {
    const code = char.codePointAt(0)!;
    bytes += code < 0x80 ? 1 : code < 0x800 ? 2 : code < 0x10000 ? 3 : 4;
  }
  return bytes;
}

export function formatBytes(bytes: number): string {
  const safe = Math.max(0, Math.round(bytes));
  if (safe < 1024) {
    return `${safe} B`;
  }
  const units = ['KB', 'MB', 'GB'];
  let value = safe / 1024;
  let unit = 0;
  while (roundCompact(value) >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${roundCompact(value)} ${units[unit]}`;
}
