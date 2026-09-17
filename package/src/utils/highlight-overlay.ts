import type { HighlightToken } from './highlighter';

export interface OverlayPiece<M> {
  text: string;
  token?: HighlightToken;
  mark: M;
}

/**
 * Splits a line at both syntax token and marked segment boundaries, so word-level marks can sit on top of
 * syntax colors; when the two do not cover the same text the segments are returned without tokens
 */
export function overlaySegments<M>(
  tokens: HighlightToken[] | undefined,
  segments: { text: string; mark: M }[]
): OverlayPiece<M>[] {
  const tokenText = tokens?.map((token) => token.content).join('') ?? '';
  const segmentText = segments.map((segment) => segment.text).join('');
  if (!tokens || tokenText !== segmentText) {
    return segments.map((segment) => ({ text: segment.text, mark: segment.mark }));
  }

  const pieces: OverlayPiece<M>[] = [];
  let tokenIndex = 0;
  let tokenOffset = 0;
  for (const segment of segments) {
    let remaining = segment.text.length;
    let cursor = 0;
    while (remaining > 0 && tokenIndex < tokens.length) {
      const token = tokens[tokenIndex];
      const available = token.content.length - tokenOffset;
      const take = Math.min(available, remaining);
      if (take > 0) {
        pieces.push({ text: segment.text.slice(cursor, cursor + take), token, mark: segment.mark });
      }
      cursor += take;
      remaining -= take;
      tokenOffset += take;
      if (tokenOffset >= token.content.length) {
        tokenIndex++;
        tokenOffset = 0;
      }
    }
  }
  return pieces;
}
