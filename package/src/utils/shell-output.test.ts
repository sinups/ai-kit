import { byteLength, formatBytes, formatJsonOutput, splitLinks, tailLines } from './shell-output';

describe('utils/shell-output', () => {
  it('splits links and keeps trailing punctuation outside', () => {
    expect(splitLinks('Local: http://localhost:3000/, docs at https://mantine.dev.')).toEqual([
      { text: 'Local: ' },
      { text: 'http://localhost:3000/', href: 'http://localhost:3000/' },
      { text: ', docs at ' },
      { text: 'https://mantine.dev', href: 'https://mantine.dev' },
      { text: '.' },
    ]);
    expect(splitLinks('see (https://en.wikipedia.org/wiki/Foo_(bar))')).toEqual([
      { text: 'see (' },
      {
        text: 'https://en.wikipedia.org/wiki/Foo_(bar)',
        href: 'https://en.wikipedia.org/wiki/Foo_(bar)',
      },
      { text: ')' },
    ]);
    expect(splitLinks('(see https://x.dev/a_(b)).')).toEqual([
      { text: '(see ' },
      { text: 'https://x.dev/a_(b)', href: 'https://x.dev/a_(b)' },
      { text: ').' },
    ]);
    expect(splitLinks('no links')).toEqual([{ text: 'no links' }]);
  });

  it('pretty-prints JSON output only', () => {
    expect(formatJsonOutput(' {"ok":true,"items":[1]} ')).toBe(
      '{\n  "ok": true,\n  "items": [\n    1\n  ]\n}'
    );
    expect(formatJsonOutput('{broken')).toBeNull();
    expect(formatJsonOutput('42')).toBeNull();
    expect(formatJsonOutput('Done in 2s')).toBeNull();
  });

  it('keeps the tail of lines', () => {
    expect(tailLines([1, 2, 3, 4, 5], 2)).toEqual({ visible: [4, 5], hidden: 3 });
    expect(tailLines([1, 2], 5)).toEqual({ visible: [1, 2], hidden: 0 });
    expect(tailLines([1, 2], 0)).toEqual({ visible: [1, 2], hidden: 0 });
  });

  it('measures and formats sizes', () => {
    expect(byteLength('ё')).toBe(2);
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(1536)).toBe('1.5 KB');
    expect(formatBytes(5 * 1024 * 1024)).toBe('5 MB');
    expect(formatBytes(300 * 1024)).toBe('300 KB');
    expect(formatBytes(1023.6)).toBe('1 KB');
    expect(formatBytes(1_048_575)).toBe('1 MB');
  });
});
