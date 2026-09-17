import { buildDiffRows, collapseUnchanged, toSplitRows, type DiffRow } from './diff-rows';

const text = (row: DiffRow) => row.segments.map((segment) => segment.text).join('');

describe('diff/diff-rows', () => {
  it('numbers lines and highlights words in replaced pairs', () => {
    const rows = buildDiffRows('a\nconst x = 1;\nb\n', 'a\nconst x = 2;\nb\nc\n');
    expect(rows.map((row) => [row.type, row.oldNumber, row.newNumber, text(row)])).toEqual([
      ['context', 1, 1, 'a'],
      ['remove', 2, undefined, 'const x = 1;'],
      ['add', undefined, 2, 'const x = 2;'],
      ['context', 3, 3, 'b'],
      ['add', undefined, 4, 'c'],
    ]);
    expect(rows[1].segments).toEqual([
      { text: 'const x = ', type: 'equal' },
      { text: '1', type: 'removed' },
      { text: ';', type: 'equal' },
    ]);
    expect(rows[4].segments).toEqual([{ text: 'c', type: 'equal' }]);
  });

  it('does not highlight words in unrelated pairs', () => {
    const rows = buildDiffRows('import a from "a";', 'export default function Page() {}');
    expect(rows[0].segments).toEqual([{ text: 'import a from "a";', type: 'equal' }]);
    expect(rows[1].segments).toEqual([
      { text: 'export default function Page() {}', type: 'equal' },
    ]);
  });

  it('pairs removed and added lines side by side', () => {
    const rows = buildDiffRows('a\nb\nc\nd', 'a\nB\nd\ne');
    expect(
      toSplitRows(rows).map(({ left, right }) => [left && text(left), right && text(right)])
    ).toEqual([
      ['a', 'a'],
      ['b', 'B'],
      ['c', undefined],
      ['d', 'd'],
      [undefined, 'e'],
    ]);
  });

  it('collapses long unchanged runs and keeps context around changes', () => {
    const rows = Array.from({ length: 20 }, (_, index) => (index === 10 ? 'x' : '.'));
    const unchanged = (row: string) => row === '.';
    const items = collapseUnchanged(rows, unchanged, 2);

    expect(
      items.map((item) => (item.kind === 'gap' ? `gap:${item.start}-${item.end}` : item.index))
    ).toEqual(['gap:0-8', 8, 9, 10, 11, 12, 'gap:13-20']);

    const opened = collapseUnchanged(rows, unchanged, 2, new Set([13]));
    expect(opened.filter((item) => item.kind === 'gap')).toHaveLength(1);
    expect(opened).toHaveLength(1 + 5 + 7);
  });

  it('keeps short unchanged runs visible', () => {
    const rows = ['x', '.', '.', '.', '.', '.', '.', '.', 'x'];
    const items = collapseUnchanged(rows, (row) => row === '.', 3);
    expect(items.every((item) => item.kind === 'row')).toBe(true);
  });
});
