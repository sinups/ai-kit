export interface MarkdownStreamParts {
  /** Finished top-level blocks that will not change while more text arrives */
  stable: string[];
  /** The last, still growing part of the text */
  tail: string;
}

const FENCE_RE = /^ {0,3}(`{3,}|~{3,})/;

interface FenceState {
  char: string;
  length: number;
}

function updateFence(line: string, fence: FenceState | null): FenceState | null {
  const match = FENCE_RE.exec(line);
  if (!match) {
    return fence;
  }
  const marker = match[1];
  if (!fence) {
    return { char: marker[0], length: marker.length };
  }
  const closes =
    marker[0] === fence.char && marker.length >= fence.length && line.trim() === marker;
  return closes ? null : fence;
}

const LIST_MARKER_RE = /^(?:([-*+])|\d{1,9}([.)]))\s/;
const LINK_DEFINITION_RE = /^ {0,3}\[[^\]\n]+\]:/m;

function getListKind(line: string): string | null {
  const match = LIST_MARKER_RE.exec(line);
  return match ? (match[1] ?? `ordered${match[2]}`) : null;
}

function continuesList(blockLines: string[], nextLine: string): boolean {
  const nextKind = getListKind(nextLine);
  if (!nextKind) {
    return false;
  }
  for (let index = blockLines.length - 1; index >= 0; index--) {
    const kind = getListKind(blockLines[index]);
    if (kind) {
      return kind === nextKind;
    }
  }
  return false;
}

const DANGLING_ORDERED_MARKER_RE = /^\d+\.\s*$/;

function endsWithDanglingOrderedMarker(blockLines: string[]): boolean {
  for (let index = blockLines.length - 1; index >= 0; index--) {
    const line = blockLines[index];
    if (line.trim() !== '') {
      return DANGLING_ORDERED_MARKER_RE.test(line);
    }
  }
  return false;
}

interface BlockScan {
  stable: string[];
  /** Character offset in `content` where the still growing part starts */
  tailStart: number;
}

function scanBlocks(content: string): BlockScan {
  const lines = content.split('\n');
  const offsets: number[] = new Array(lines.length);
  let offset = 0;
  for (let index = 0; index < lines.length; index++) {
    offsets[index] = offset;
    offset += lines[index].length + 1;
  }
  const stable: string[] = [];
  let blockStart = 0;
  let fence: FenceState | null = null;

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    const wasInFence = fence !== null;
    fence = updateFence(line, fence);
    if (wasInFence || fence !== null || line.trim() !== '') {
      continue;
    }
    let next = index + 1;
    while (next < lines.length && lines[next].trim() === '') {
      next++;
    }
    if (next >= lines.length) {
      break;
    }
    if (/^\s/.test(lines[next]) || continuesList(lines.slice(blockStart, index), lines[next])) {
      continue;
    }
    const blockLines = lines.slice(blockStart, index);
    // A block ending in a bare `1.` is joined with what follows, so committing here would freeze a
    // split that the finished text never has.
    if (endsWithDanglingOrderedMarker(blockLines)) {
      continue;
    }
    const block = blockLines.join('\n');
    if (block.trim()) {
      stable.push(block);
    }
    blockStart = next;
    index = next - 1;
  }

  return { stable, tailStart: offsets[blockStart] };
}

/**
 * Splits streamed markdown at blank lines outside code fences. A block is stable once a blank line
 * follows it and the next line starts a new top-level block: not an indented continuation and not
 * the next item of the same list. Reference definitions resolve across the whole document, so
 * content that has them is never split.
 */
export function splitMarkdownStream(content: string): MarkdownStreamParts {
  if (LINK_DEFINITION_RE.test(content)) {
    return { stable: [], tail: content };
  }
  const { stable, tailStart } = scanBlocks(content);
  return { stable, tail: content.slice(tailStart) };
}

/** Cuts the still growing tail at its last complete line, so the unfinished one is held back */
export function cutTailToLastLine(tail: string): string {
  const lastBreak = tail.lastIndexOf('\n');
  return lastBreak === -1 ? '' : tail.slice(0, lastBreak + 1);
}

export type MarkdownStreamReader = (content: string) => MarkdownStreamParts;

/**
 * Stateful reader for one growing answer: it keeps the stable prefix it has already split, scans
 * only what arrived since, and runs `normalize` once per part. Content that no longer starts with
 * the prefix resets the reader, so a reused instance still returns what a fresh split would.
 */
export function createMarkdownStreamReader(
  normalize: (part: string) => string = (part) => part
): MarkdownStreamReader {
  let seen: string | null = null;
  let consumed = 0;
  let scannedFrom = 0;
  let referenced = false;
  let stable: string[] = [];
  let parts: MarkdownStreamParts = { stable, tail: '' };

  return (content) => {
    if (content === seen) {
      return parts;
    }
    if (seen === null || !content.startsWith(seen)) {
      consumed = 0;
      scannedFrom = 0;
      referenced = false;
      stable = [];
    }
    seen = content;
    if (!referenced) {
      const region = content.slice(scannedFrom);
      referenced = LINK_DEFINITION_RE.test(region);
      if (!referenced) {
        scannedFrom += region.lastIndexOf('\n') + 1;
      }
    }
    if (referenced) {
      parts = { stable: [], tail: normalize(content) };
      return parts;
    }
    const scan = scanBlocks(content.slice(consumed));
    if (scan.stable.length > 0) {
      stable = [...stable, ...scan.stable.map(normalize)];
    }
    consumed += scan.tailStart;
    parts = { stable, tail: normalize(content.slice(consumed)) };
    return parts;
  };
}

function getOpenFence(lines: string[]): FenceState | null {
  let fence: FenceState | null = null;
  for (const line of lines) {
    fence = updateFence(line, fence);
  }
  return fence;
}

export function hasOpenFence(content: string): boolean {
  return getOpenFence(content.split('\n')) !== null;
}

/** Makes an unfinished tail render sensibly: closes an open code fence and drops a dangling empty list marker */
export function closeUnfinishedMarkdown(tail: string): string {
  const lines = tail.split('\n');
  const fence = getOpenFence(lines);
  if (fence) {
    const body = tail.endsWith('\n') ? tail : `${tail}\n`;
    return `${body}${fence.char.repeat(fence.length)}`;
  }
  const last = lines[lines.length - 1];
  if (/^\s*(?:[-*+]|\d+[.)])\s*$/.test(last)) {
    return lines.slice(0, -1).join('\n');
  }
  return tail;
}
