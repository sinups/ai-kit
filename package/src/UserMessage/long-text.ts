export type LongTextThreshold = {
  /** Text longer than this many characters is collapsed, `2000` by default */
  chars?: number;
  /** Text with more lines than this is collapsed, `30` by default */
  lines?: number;
};

export type CollapsedText = {
  head: string;
  tail: string;
  /** Number of characters hidden between head and tail */
  hiddenChars: number;
  /** Number of whole lines hidden between head and tail */
  hiddenLines: number;
};

const HEAD_SHARE = 0.6;

/** Head and tail of a long text, `null` when the text is within the threshold */
export function collapseLongText(
  text: string,
  { chars = 2000, lines = 30 }: LongTextThreshold = {}
): CollapsedText | null {
  const allLines = text.split('\n');
  if (text.length <= chars && allLines.length <= lines) {
    return null;
  }

  if (allLines.length > lines) {
    const headCount = Math.max(1, Math.round(lines * HEAD_SHARE * 0.5));
    const tailCount = Math.max(1, Math.round(lines * (1 - HEAD_SHARE) * 0.5));
    const head = allLines.slice(0, headCount).join('\n');
    const tail = allLines.slice(allLines.length - tailCount).join('\n');
    if (head.length + tail.length <= chars) {
      return {
        head,
        tail,
        hiddenChars: text.length - head.length - tail.length - 2,
        hiddenLines: allLines.length - headCount - tailCount,
      };
    }
  }

  const headLength = Math.round(chars * HEAD_SHARE * 0.5);
  const tailLength = Math.round(chars * (1 - HEAD_SHARE) * 0.5);
  const head = text.slice(0, headLength).trimEnd();
  const tail = text.slice(text.length - tailLength).trimStart();
  const hidden = text.slice(headLength, text.length - tailLength);
  return {
    head,
    tail,
    hiddenChars: text.length - head.length - tail.length,
    hiddenLines: Math.max(0, hidden.split('\n').length - 1),
  };
}
