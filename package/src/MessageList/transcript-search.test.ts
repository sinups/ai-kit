import { findDomMatches, findTextMatches, stepMatchIndex } from './transcript-search';

describe('MessageList/transcript-search', () => {
  it('finds case-insensitive non-overlapping matches', () => {
    expect(findTextMatches('Token token TOKEN', 'token')).toEqual([
      { start: 0, end: 5 },
      { start: 6, end: 11 },
      { start: 12, end: 17 },
    ]);
    expect(findTextMatches('aaaa', 'aa')).toHaveLength(2);
    expect(findTextMatches('abc', '  ')).toEqual([]);
  });

  it('steps through matches with wrap-around', () => {
    expect(stepMatchIndex(-1, 3, 1)).toBe(0);
    expect(stepMatchIndex(-1, 3, -1)).toBe(2);
    expect(stepMatchIndex(2, 3, 1)).toBe(0);
    expect(stepMatchIndex(0, 3, -1)).toBe(2);
    expect(stepMatchIndex(0, 0, 1)).toBe(-1);
  });

  it('maps matches to DOM ranges across elements and skips ignored subtrees', () => {
    const root = document.createElement('div');
    root.innerHTML =
      '<p>refresh <strong>tok</strong>en</p><div data-search-ignore>token</div><p>token again</p>';
    const ranges = findDomMatches(root, 'token');
    expect(ranges.map((range) => range.toString())).toEqual(['token', 'token']);
    expect(ranges[0].startContainer.textContent).toBe('tok');
    expect(ranges[0].endContainer.textContent).toBe('en');
  });
});
