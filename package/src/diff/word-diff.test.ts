import { diffWords, splitWordDiff, tokenizeWords, wordDiffSimilarity } from './word-diff';

describe('diff/word-diff', () => {
  it('tokenizes words, whitespace and punctuation', () => {
    expect(tokenizeWords('const total = sum(items);')).toEqual([
      'const',
      ' ',
      'total',
      ' ',
      '=',
      ' ',
      'sum',
      '(',
      'items',
      ')',
      ';',
    ]);
    expect(tokenizeWords('')).toEqual([]);
    expect(tokenizeWords('привет мир')).toEqual(['привет', ' ', 'мир']);
  });

  it('marks only the changed words', () => {
    expect(diffWords('const total = sum(items);', 'const total = sumBy(items, price);')).toEqual([
      { text: 'const total = ', type: 'equal' },
      { text: 'sum', type: 'removed' },
      { text: 'sumBy', type: 'added' },
      { text: '(items', type: 'equal' },
      { text: ', price', type: 'added' },
      { text: ');', type: 'equal' },
    ]);
  });

  it('handles identical, empty and fully replaced lines', () => {
    expect(diffWords('same', 'same')).toEqual([{ text: 'same', type: 'equal' }]);
    expect(diffWords('', 'new')).toEqual([{ text: 'new', type: 'added' }]);
    expect(diffWords('old', '')).toEqual([{ text: 'old', type: 'removed' }]);
    expect(diffWords('alpha', 'beta')).toEqual([
      { text: 'alpha', type: 'removed' },
      { text: 'beta', type: 'added' },
    ]);
  });

  it('splits into old and new sides and measures similarity', () => {
    const segments = diffWords('return a + b;', 'return a - b;');
    expect(splitWordDiff(segments)).toEqual({
      old: [
        { text: 'return a ', type: 'equal' },
        { text: '+', type: 'removed' },
        { text: ' b;', type: 'equal' },
      ],
      new: [
        { text: 'return a ', type: 'equal' },
        { text: '-', type: 'added' },
        { text: ' b;', type: 'equal' },
      ],
    });
    expect(wordDiffSimilarity(segments)).toBeGreaterThan(0.8);
    expect(wordDiffSimilarity(diffWords('alpha', 'beta'))).toBe(0);
    expect(wordDiffSimilarity([])).toBe(1);
  });
});
