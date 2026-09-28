/** Total number of characters the answer had shown at that moment */
export type FadeMark = { total: number; at: number };

/**
 * A piece of one text node. `from` is the offset the piece starts at — set while the piece is young
 * enough to fade in, and stable between renders, so it also serves as its key.
 */
export type FadeSegment = { text: string; from?: number };

/** How long a word keeps its own segment, so its fade is never cut short by the next one */
export const FADE_WINDOW_MS = 400;

/**
 * Remembers where the answer ended at the last few renders. Marks older than `windowMs` are
 * forgotten: their text is settled and joins the plain body again. A shorter answer means a new
 * one, so the marks start over.
 */
export function trackFadeMarks(
  marks: FadeMark[],
  total: number,
  now: number,
  windowMs: number = FADE_WINDOW_MS
): FadeMark[] {
  const last = marks[marks.length - 1];
  if (last && total < last.total) {
    return [];
  }
  const kept = marks.filter((mark) => now - mark.at < windowMs);
  if (last && total === last.total) {
    return kept;
  }
  return [...kept, { total, at: now }];
}

/**
 * Splits one text node into settled text and the batches released after it. `from` is how many
 * characters of the answer come before this node.
 */
export function splitByFadeMarks(text: string, from: number, marks: FadeMark[]): FadeSegment[] {
  const oldest = marks[0]?.total ?? Infinity;
  const to = from + text.length;
  if (text.length === 0 || to <= oldest) {
    return [{ text }];
  }
  const bounds = [oldest, ...marks.slice(1).map((mark) => mark.total)].filter(
    (bound) => bound > from && bound < to
  );
  const segments: FadeSegment[] = [];
  let cut = from;
  for (const bound of bounds) {
    segments.push({ text: text.slice(cut - from, bound - from), from: freshAt(cut, oldest) });
    cut = bound;
  }
  segments.push({ text: text.slice(cut - from), from: freshAt(cut, oldest) });
  return segments.filter((segment) => segment.text.length > 0);
}

function freshAt(start: number, oldest: number): number | undefined {
  return start >= oldest ? start : undefined;
}
