import type { DiffLine } from '../types/timeline';

/** Above this many LCS cells the middle section falls back to remove-all then add-all */
const MAX_LCS_CELLS = 4_000_000;

/**
 * Line-based diff using LCS. Produces a unified list of add/remove/context lines.
 * Replaces `@pierre/diffs` from the reference implementation.
 */
export function diffLines(oldText: string, newText: string): DiffLine[] {
  const a = oldText.length ? oldText.split('\n') : [];
  const b = newText.length ? newText.split('\n') : [];

  let start = 0;
  while (start < a.length && start < b.length && a[start] === b[start]) {
    start++;
  }
  let endA = a.length;
  let endB = b.length;
  while (endA > start && endB > start && a[endA - 1] === b[endB - 1]) {
    endA--;
    endB--;
  }

  const out: DiffLine[] = [];
  for (let k = 0; k < start; k++) {
    out.push({ type: 'context', content: a[k] });
  }
  diffMiddle(a, start, endA, b, start, endB, out);
  for (let k = endA; k < a.length; k++) {
    out.push({ type: 'context', content: a[k] });
  }
  return out;
}

function diffMiddle(
  a: string[],
  startA: number,
  endA: number,
  b: string[],
  startB: number,
  endB: number,
  out: DiffLine[]
): void {
  const n = endA - startA;
  const m = endB - startB;

  if (n === 0 || m === 0 || n * m > MAX_LCS_CELLS) {
    for (let k = startA; k < endA; k++) {
      out.push({ type: 'remove', content: a[k] });
    }
    for (let k = startB; k < endB; k++) {
      out.push({ type: 'add', content: b[k] });
    }
    return;
  }

  const dp: Uint32Array[] = new Array(n + 1);
  for (let i = 0; i <= n; i++) {
    dp[i] = new Uint32Array(m + 1);
  }
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] =
        a[startA + i] === b[startB + j]
          ? dp[i + 1][j + 1] + 1
          : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[startA + i] === b[startB + j]) {
      out.push({ type: 'context', content: a[startA + i] });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      out.push({ type: 'remove', content: a[startA + i] });
      i++;
    } else {
      out.push({ type: 'add', content: b[startB + j] });
      j++;
    }
  }
  while (i < n) {
    out.push({ type: 'remove', content: a[startA + i++] });
  }
  while (j < m) {
    out.push({ type: 'add', content: b[startB + j++] });
  }
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
