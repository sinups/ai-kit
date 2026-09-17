import { overlaySegments } from './highlight-overlay';

const tokens = [
  { content: 'const', color: 'blue' },
  { content: ' x = ' },
  { content: '42', color: 'green' },
  { content: ';' },
];

describe('utils/highlight-overlay', () => {
  it('splits at token and segment boundaries', () => {
    const pieces = overlaySegments(tokens, [
      { text: 'const x = 4', mark: false },
      { text: '2', mark: true },
      { text: ';', mark: false },
    ]);
    expect(pieces.map((piece) => [piece.text, piece.token?.color, piece.mark])).toEqual([
      ['const', 'blue', false],
      [' x = ', undefined, false],
      ['4', 'green', false],
      ['2', 'green', true],
      [';', undefined, false],
    ]);
  });

  it('falls back to plain segments when the text differs or tokens are missing', () => {
    const segments = [{ text: 'let y;', mark: false }];
    expect(overlaySegments(tokens, segments)).toEqual([{ text: 'let y;', mark: false }]);
    expect(overlaySegments(undefined, segments)).toEqual([{ text: 'let y;', mark: false }]);
    expect(overlaySegments([], [])).toEqual([]);
  });
});
