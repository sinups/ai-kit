import { diffLines } from '../utils/line-diff';
import { stripTrailingNewline } from './file-tree';
import type { WordSegment } from './types';
import { diffWords, splitWordDiff, wordDiffSimilarity } from './word-diff';

export type DiffRowType = 'context' | 'add' | 'remove';

export interface DiffRow {
  type: DiffRowType;
  oldNumber?: number;
  newNumber?: number;
  segments: WordSegment[];
}

export interface SplitDiffRow {
  left?: DiffRow;
  right?: DiffRow;
}

export type CollapsedItem<T> =
  | { kind: 'row'; row: T; index: number }
  | { kind: 'gap'; start: number; end: number; count: number };

/** Below this share of equal text a replaced pair is shown without word highlights */
const MIN_SIMILARITY = 0.35;

const plain = (text: string, type: WordSegment['type']): WordSegment[] =>
  text ? [{ text, type }] : [];

/** Unified rows with line numbers; only similar removed/added pairs carry `added`/`removed` word segments */
export function buildDiffRows(oldText: string, newText: string): DiffRow[] {
  const lines = diffLines(stripTrailingNewline(oldText), stripTrailingNewline(newText));
  const rows: DiffRow[] = [];
  let oldNumber = 1;
  let newNumber = 1;
  let i = 0;

  while (i < lines.length) {
    if (lines[i].type === 'context') {
      rows.push({
        type: 'context',
        oldNumber: oldNumber++,
        newNumber: newNumber++,
        segments: plain(lines[i].content, 'equal'),
      });
      i++;
      continue;
    }

    let removeEnd = i;
    while (removeEnd < lines.length && lines[removeEnd].type === 'remove') {
      removeEnd++;
    }
    let addEnd = removeEnd;
    while (addEnd < lines.length && lines[addEnd].type === 'add') {
      addEnd++;
    }
    const removed = lines.slice(i, removeEnd);
    const added = lines.slice(removeEnd, addEnd);
    const pairs = removed.map((line, index) => {
      const partner = added[index];
      if (!partner) {
        return null;
      }
      const words = diffWords(line.content, partner.content);
      return wordDiffSimilarity(words) >= MIN_SIMILARITY ? splitWordDiff(words) : null;
    });

    removed.forEach((line, index) => {
      rows.push({
        type: 'remove',
        oldNumber: oldNumber++,
        segments: pairs[index]?.old ?? plain(line.content, 'equal'),
      });
    });
    added.forEach((line, index) => {
      rows.push({
        type: 'add',
        newNumber: newNumber++,
        segments: pairs[index]?.new ?? plain(line.content, 'equal'),
      });
    });
    i = addEnd;
  }

  return rows;
}

/** Side-by-side rows: context on both sides, removed lines paired with the added lines that follow */
export function toSplitRows(rows: DiffRow[]): SplitDiffRow[] {
  const out: SplitDiffRow[] = [];
  let i = 0;
  while (i < rows.length) {
    if (rows[i].type === 'context') {
      out.push({ left: rows[i], right: rows[i] });
      i++;
      continue;
    }
    const removed: DiffRow[] = [];
    const added: DiffRow[] = [];
    while (i < rows.length && rows[i].type === 'remove') {
      removed.push(rows[i++]);
    }
    while (i < rows.length && rows[i].type === 'add') {
      added.push(rows[i++]);
    }
    for (let k = 0; k < Math.max(removed.length, added.length); k++) {
      out.push({ left: removed[k], right: added[k] });
    }
  }
  return out;
}

/**
 * Hides runs of unchanged rows longer than `2 * context + 1`, keeping `context` rows next to changes;
 * gaps whose `start` is in `expanded` stay open
 */
export function collapseUnchanged<T>(
  rows: T[],
  isUnchanged: (row: T) => boolean,
  context = 3,
  expanded: ReadonlySet<number> = new Set()
): CollapsedItem<T>[] {
  const out: CollapsedItem<T>[] = [];
  let i = 0;
  while (i < rows.length) {
    if (!isUnchanged(rows[i])) {
      out.push({ kind: 'row', row: rows[i], index: i });
      i++;
      continue;
    }
    let end = i;
    while (end < rows.length && isUnchanged(rows[end])) {
      end++;
    }
    const keepBefore = i === 0 ? 0 : context;
    const keepAfter = end === rows.length ? 0 : context;
    const hidden = end - i - keepBefore - keepAfter;
    if (hidden <= 1 || expanded.has(i + keepBefore)) {
      for (let k = i; k < end; k++) {
        out.push({ kind: 'row', row: rows[k], index: k });
      }
    } else {
      for (let k = i; k < i + keepBefore; k++) {
        out.push({ kind: 'row', row: rows[k], index: k });
      }
      out.push({ kind: 'gap', start: i + keepBefore, end: end - keepAfter, count: hidden });
      for (let k = end - keepAfter; k < end; k++) {
        out.push({ kind: 'row', row: rows[k], index: k });
      }
    }
    i = end;
  }
  return out;
}
