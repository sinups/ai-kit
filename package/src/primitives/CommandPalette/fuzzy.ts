export interface FuzzyMatch {
  score: number;
  indices: number[];
}

export type FuzzyKey<T> = keyof T | ((item: T) => string | string[] | null | undefined);

export interface FuzzyResult<T> {
  item: T;
  score: number;
  /** Matched character indices per key, aligned with `keys`; array values are joined with a space */
  matches: (number[] | null)[];
}

const MATCH_SCORE = 1;
const WORD_START_BONUS = 8;
const TEXT_START_BONUS = 4;
const CONSECUTIVE_BONUS = 6;
const GAP_PENALTY = 0.2;
const MAX_GAP_PENALTY = 3;
const FULL_GAP = Math.ceil(MAX_GAP_PENALTY / GAP_PENALTY);
const LEADING_PENALTY = 0.1;
const MAX_LEADING_PENALTY = 2;
const LENGTH_PENALTY = 0.01;
const KEY_ORDER_PENALTY = 0.5;

const SEPARATOR = /[\s\-_/.:()[\]]/;

function isWordStart(text: string, index: number): boolean {
  if (index === 0) {
    return true;
  }
  const previous = text[index - 1];
  const current = text[index];
  if (SEPARATOR.test(previous)) {
    return !SEPARATOR.test(current);
  }
  return previous === previous.toLowerCase() && current !== current.toLowerCase();
}

function isSubsequence(needle: string, haystack: string): boolean {
  let matched = 0;
  for (let j = 0; j < haystack.length && matched < needle.length; j++) {
    if (haystack[j] === needle[matched]) {
      matched++;
    }
  }
  return matched === needle.length;
}

/** Scores `query` as a case-insensitive subsequence of `text`, `null` when it does not match */
export function fuzzyScore(query: string, text: string): FuzzyMatch | null {
  const needle = query.trim().toLowerCase().replace(/\s+/g, '');
  if (!needle) {
    return { score: 0, indices: [] };
  }
  if (needle.length > text.length) {
    return null;
  }

  const haystack = text.toLowerCase();
  if (!isSubsequence(needle, haystack)) {
    return null;
  }

  const n = needle.length;
  const m = text.length;
  const parent: Int32Array[] = Array.from({ length: n }, () => new Int32Array(m).fill(-1));
  let previousRow = new Float64Array(m);
  let row = new Float64Array(m);

  for (let i = 0; i < n; i++) {
    row.fill(-Infinity);
    let farBest = -Infinity;
    let farIndex = -1;
    for (let j = i; j < m; j++) {
      const far = j - 1 - FULL_GAP;
      if (i > 0 && far >= 0 && previousRow[far] > farBest) {
        farBest = previousRow[far];
        farIndex = far;
      }
      if (haystack[j] !== needle[i]) {
        continue;
      }
      let charScore = MATCH_SCORE;
      if (isWordStart(text, j)) {
        charScore += WORD_START_BONUS;
      }
      if (j === 0) {
        charScore += TEXT_START_BONUS;
      }

      if (i === 0) {
        row[j] = charScore - Math.min(j * LEADING_PENALTY, MAX_LEADING_PENALTY);
        continue;
      }
      let score = farIndex === -1 ? -Infinity : farBest + charScore - MAX_GAP_PENALTY;
      let from = farIndex;
      for (let k = Math.max(i - 1, far + 1); k < j; k++) {
        const previous = previousRow[k];
        if (previous === -Infinity) {
          continue;
        }
        const gap = j - k - 1;
        const candidate =
          previous + charScore + (gap === 0 ? CONSECUTIVE_BONUS : -gap * GAP_PENALTY);
        if (candidate > score) {
          score = candidate;
          from = k;
        }
      }
      row[j] = score;
      parent[i][j] = from;
    }
    [previousRow, row] = [row, previousRow];
  }

  let end = -1;
  for (let j = n - 1; j < m; j++) {
    if (previousRow[j] > (end === -1 ? -Infinity : previousRow[end])) {
      end = j;
    }
  }

  const indices = new Array<number>(n);
  for (let i = n - 1, j = end; i >= 0; i--) {
    indices[i] = j;
    j = parent[i][j];
  }
  return { score: previousRow[end] - m * LENGTH_PENALTY, indices };
}

function readKey<T>(item: T, key: FuzzyKey<T>): string {
  const value = typeof key === 'function' ? key(item) : item[key];
  if (Array.isArray(value)) {
    return value.join(' ');
  }
  return typeof value === 'string' ? value : '';
}

/** Keeps items matching `query` in any key, sorted by the best key score; a blank query keeps the order */
export function fuzzyFilter<T>(items: T[], query: string, keys: FuzzyKey<T>[]): FuzzyResult<T>[] {
  if (!query.trim()) {
    return items.map((item) => ({ item, score: 0, matches: keys.map(() => null) }));
  }

  const results: FuzzyResult<T>[] = [];
  for (const item of items) {
    let score = -Infinity;
    const matches = keys.map((key, keyIndex) => {
      const match = fuzzyScore(query, readKey(item, key));
      if (!match) {
        return null;
      }
      score = Math.max(score, match.score - keyIndex * KEY_ORDER_PENALTY);
      return match.indices;
    });
    if (score !== -Infinity) {
      results.push({ item, score, matches });
    }
  }
  return results.sort((a, b) => b.score - a.score);
}

export function splitByIndices(
  text: string,
  indices: number[]
): { text: string; highlighted: boolean }[] {
  if (indices.length === 0) {
    return text ? [{ text, highlighted: false }] : [];
  }
  const marked = new Set(indices);
  const parts: { text: string; highlighted: boolean }[] = [];
  for (let index = 0; index < text.length; index++) {
    const highlighted = marked.has(index);
    const last = parts[parts.length - 1];
    if (last && last.highlighted === highlighted) {
      last.text += text[index];
    } else {
      parts.push({ text: text[index], highlighted });
    }
  }
  return parts;
}
