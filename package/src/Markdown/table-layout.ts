export const STACKED_TABLE_MIN_COLUMNS = 3;
export const STACKED_TABLE_COLUMN_WIDTH = 120;

/** Wide tables become one card per row when the columns cannot get a readable width */
export function shouldStackTable(
  columnCount: number,
  width: number,
  minColumnWidth = STACKED_TABLE_COLUMN_WIDTH
): boolean {
  if (width <= 0 || columnCount < STACKED_TABLE_MIN_COLUMNS) {
    return false;
  }
  return width < columnCount * minColumnWidth;
}
