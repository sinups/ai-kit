import { countDiffStats, diffLines } from './line-diff';

describe('utils/diffLines', () => {
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

describe('utils/line-diff diffLines on large inputs', () => {
  it('keeps shared head and tail as context', () => {
    const head = Array.from({ length: 50 }, (_, i) => `head ${i}`);
    const tail = Array.from({ length: 50 }, (_, i) => `tail ${i}`);
    const result = diffLines(
      [...head, 'old', ...tail].join('\n'),
      [...head, 'new', ...tail].join('\n')
    );
    expect(countDiffStats(result)).toEqual({ added: 1, removed: 1 });
    expect(result[0]).toEqual({ type: 'context', content: 'head 0' });
    expect(result[result.length - 1]).toEqual({ type: 'context', content: 'tail 49' });
  });

  it('falls back to remove-all and add-all above the size limit', () => {
    const oldText = Array.from({ length: 3000 }, (_, i) => `a${i}`).join('\n');
    const newText = Array.from({ length: 3000 }, (_, i) => `b${i}`).join('\n');
    const result = diffLines(oldText, newText);
    expect(countDiffStats(result)).toEqual({ added: 3000, removed: 3000 });
    expect(result[0].type).toBe('remove');
    expect(result[result.length - 1].type).toBe('add');
  });
});
