import { diffSequences } from '../utils/sequence-diff';
import type { WordSegment, WordSegmentType } from './types';

const TOKEN = /[\p{L}\p{N}_]+|\s+|[^\p{L}\p{N}_\s]/gu;

/** Above this many LCS cells the pair is treated as fully replaced */
const MAX_WORD_CELLS = 250_000;

export function tokenizeWords(text: string): string[] {
  return text.match(TOKEN) ?? [];
}

function push(out: WordSegment[], text: string, type: WordSegmentType) {
  const last = out[out.length - 1];
  if (last && last.type === type) {
    last.text += text;
  } else if (text) {
    out.push({ text, type });
  }
}

const SEGMENT_TYPES = { equal: 'equal', remove: 'removed', add: 'added' } as const;

/** Word-level diff of two versions of a line: LCS over words, whitespace and punctuation */
export function diffWords(oldText: string, newText: string): WordSegment[] {
  const out: WordSegment[] = [];
  diffSequences(tokenizeWords(oldText), tokenizeWords(newText), MAX_WORD_CELLS, (op, token) =>
    push(out, token, SEGMENT_TYPES[op])
  );
  return out;
}

/** Old side (equal + removed) and new side (equal + added) of a word diff */
export function splitWordDiff(segments: WordSegment[]): {
  old: WordSegment[];
  new: WordSegment[];
} {
  const oldSide: WordSegment[] = [];
  const newSide: WordSegment[] = [];
  for (const segment of segments) {
    if (segment.type !== 'added') {
      push(oldSide, segment.text, segment.type);
    }
    if (segment.type !== 'removed') {
      push(newSide, segment.text, segment.type);
    }
  }
  return { old: oldSide, new: newSide };
}

/** Share of the longer line that stayed equal, from 0 to 1 */
export function wordDiffSimilarity(segments: WordSegment[]): number {
  let equal = 0;
  let removed = 0;
  let added = 0;
  for (const segment of segments) {
    const length = segment.text.trim().length;
    if (segment.type === 'equal') {
      equal += length;
    } else if (segment.type === 'removed') {
      removed += length;
    } else {
      added += length;
    }
  }
  const longest = Math.max(equal + removed, equal + added);
  return longest === 0 ? 1 : equal / longest;
}
