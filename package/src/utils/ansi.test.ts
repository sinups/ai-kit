import { hasAnsi, parseAnsiLines, stripAnsi } from './ansi';

describe('utils/ansi', () => {
  it('maps SGR colors and attributes to segments per line', () => {
    const lines = parseAnsiLines('\x1b[32m✓\x1b[0m passed\n\x1b[1;31mFAIL\x1b[22m src/a.ts\x1b[0m');
    expect(lines).toEqual([
      [{ fg: 'green', text: '✓' }, { text: ' passed' }],
      [
        { fg: 'red', bold: true, text: 'FAIL' },
        { fg: 'red', text: ' src/a.ts' },
      ],
    ]);
  });

  it('keeps the style across lines and handles bright, background and 256 colors', () => {
    const lines = parseAnsiLines(
      '\x1b[94mone\ntwo\x1b[39m \x1b[41;38;5;11mhot\x1b[49m\x1b[38;2;1;2;3mrgb'
    );
    expect(lines).toEqual([
      [{ fg: 'blue', text: 'one' }],
      [
        { fg: 'blue', text: 'two' },
        { text: ' ' },
        { bg: 'red', fg: 'yellow', text: 'hot' },
        { text: 'rgb' },
      ],
    ]);
  });

  it('drops cursor and OSC sequences and resolves carriage returns', () => {
    expect(
      parseAnsiLines('\x1b[2K\x1b[1Gloading 10%\rloading 100%\r\ndone\x1b]0;title\x07')
    ).toEqual([[{ text: 'loading 100%' }], [{ text: 'done' }]]);
  });

  it('strips and detects escapes', () => {
    expect(stripAnsi('\x1b[31merror\x1b[0m')).toBe('error');
    expect(hasAnsi('plain')).toBe(false);
    expect(hasAnsi('\x1b[1mbold')).toBe(true);
    expect(parseAnsiLines('')).toEqual([[]]);
  });
});
