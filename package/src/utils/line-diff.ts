import type { DiffLine } from '../types/timeline';
import { diffSequences } from './sequence-diff';

/** Above this many LCS cells the middle section falls back to remove-all then add-all */
const MAX_LCS_CELLS = 4_000_000;

export function diffLines(oldText: string, newText: string): DiffLine[] {
  const a = oldText.length ? oldText.split('\n') : [];
  const b = newText.length ? newText.split('\n') : [];
  const out: DiffLine[] = [];
  diffSequences(a, b, MAX_LCS_CELLS, (op, content) =>
    out.push({ type: op === 'equal' ? 'context' : op, content })
  );
  return out;
}

export function countDiffStats(lines: DiffLine[]): { added: number; removed: number } {
  let added = 0;
  let removed = 0;
  for (const line of lines) {
    if (line.type === 'add') {
      added++;
    } else if (line.type === 'remove') {
      removed++;
    }
  }
  return { added, removed };
}
