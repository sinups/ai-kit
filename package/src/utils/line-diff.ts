import type { DiffLine } from '../types/timeline';

/**
 * Line-based diff using LCS. Produces a unified list of add/remove/context lines.
 * Replaces `@pierre/diffs` from the reference implementation.
 */
export function diffLines(oldText: string, newText: string): DiffLine[] {
  const a = oldText.length ? oldText.split('\n') : [];
  const b = newText.length ? newText.split('\n') : [];
  const n = a.length;
  const m = b.length;

  if (n === 0) {
    return b.map((content) => ({ type: 'add', content }));
  }
  if (m === 0) {
    return a.map((content) => ({ type: 'remove', content }));
  }

  const dp: Uint32Array[] = new Array(n + 1);
  for (let i = 0; i <= n; i++) {
    dp[i] = new Uint32Array(m + 1);
  }
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const out: DiffLine[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      out.push({ type: 'context', content: a[i] });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      out.push({ type: 'remove', content: a[i] });
      i++;
    } else {
      out.push({ type: 'add', content: b[j] });
      j++;
    }
  }
  while (i < n) {
    out.push({ type: 'remove', content: a[i++] });
  }
  while (j < m) {
    out.push({ type: 'add', content: b[j++] });
  }
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
