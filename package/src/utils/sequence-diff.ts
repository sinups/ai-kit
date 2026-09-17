export type SequenceDiffOp = 'equal' | 'remove' | 'add';

/**
 * LCS diff of two sequences, reported item by item in order. Above `maxCells` LCS cells
 * the part between the common prefix and suffix is reported as remove-all then add-all.
 */
export function diffSequences<T>(
  a: readonly T[],
  b: readonly T[],
  maxCells: number,
  emit: (op: SequenceDiffOp, item: T) => void
): void {
  let start = 0;
  while (start < a.length && start < b.length && a[start] === b[start]) {
    emit('equal', a[start++]);
  }
  let endA = a.length;
  let endB = b.length;
  while (endA > start && endB > start && a[endA - 1] === b[endB - 1]) {
    endA--;
    endB--;
  }

  const n = endA - start;
  const m = endB - start;
  let i = 0;
  let j = 0;
  if (n > 0 && m > 0 && n * m <= maxCells) {
    const dp = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
    for (let row = n - 1; row >= 0; row--) {
      for (let col = m - 1; col >= 0; col--) {
        dp[row][col] =
          a[start + row] === b[start + col]
            ? dp[row + 1][col + 1] + 1
            : Math.max(dp[row + 1][col], dp[row][col + 1]);
      }
    }
    while (i < n && j < m) {
      if (a[start + i] === b[start + j]) {
        emit('equal', a[start + i]);
        i++;
        j++;
      } else if (dp[i + 1][j] >= dp[i][j + 1]) {
        emit('remove', a[start + i++]);
      } else {
        emit('add', b[start + j++]);
      }
    }
  }
  for (; i < n; i++) {
    emit('remove', a[start + i]);
  }
  for (; j < m; j++) {
    emit('add', b[start + j]);
  }
  for (let k = endA; k < a.length; k++) {
    emit('equal', a[k]);
  }
}
