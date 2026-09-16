import { countDiffStats, diffLines } from './line-diff';

describe('diffLines', () => {
  it('marks unchanged lines as context', () => {
    expect(diffLines('a\nb', 'a\nb')).toEqual([
      { type: 'context', content: 'a' },
      { type: 'context', content: 'b' },
    ]);
  });

  it('detects added and removed lines', () => {
    const result = diffLines('a\nb\nc', 'a\nx\nc');
    expect(result).toEqual([
      { type: 'context', content: 'a' },
      { type: 'remove', content: 'b' },
      { type: 'add', content: 'x' },
      { type: 'context', content: 'c' },
    ]);
    expect(countDiffStats(result)).toEqual({ added: 1, removed: 1 });
  });

  it('handles empty inputs', () => {
    expect(diffLines('', 'a')).toEqual([{ type: 'add', content: 'a' }]);
    expect(diffLines('a', '')).toEqual([{ type: 'remove', content: 'a' }]);
  });
});
