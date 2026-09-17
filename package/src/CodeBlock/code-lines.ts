export const DEFAULT_COLLAPSED_LINES = 20;
export const MIN_HIDDEN_LINES = 5;

export function countCodeLines(code: string): number {
  return code === '' ? 1 : code.replace(/\n$/, '').split('\n').length;
}

/** Number of lines to show while collapsed, or `null` when the code is short enough to show in full */
export function getCollapsedLineCount(
  totalLines: number,
  collapsedLines: number = DEFAULT_COLLAPSED_LINES
): number | null {
  return totalLines - collapsedLines >= MIN_HIDDEN_LINES ? collapsedLines : null;
}
