import { act, renderHook, waitFor } from '@testing-library/react';
import {
  clearHighlightCache,
  createShikiHighlighter,
  getHighlightCacheKey,
  getTokenStyle,
  hashString,
  highlightCode,
  toPlainLines,
  useHighlightedLines,
  type HighlightedLines,
  type ShikiHighlighterLike,
  type SyntaxHighlighter,
} from './highlighter';

const LINES: HighlightedLines = [[{ content: 'const', color: '#00f', darkColor: '#9cf' }]];

describe('highlighter helpers', () => {
  beforeEach(() => clearHighlightCache());

  it('hashes deterministically and distinguishes lengths', () => {
    expect(hashString('abc')).toBe(hashString('abc'));
    expect(hashString('abc')).not.toBe(hashString('abcd'));
  });

  it('builds keys per highlighter instance and language', () => {
    const a: SyntaxHighlighter = () => null;
    const b: SyntaxHighlighter = () => null;
    expect(getHighlightCacheKey('x', 'ts', a)).toBe(getHighlightCacheKey('x', 'ts', a));
    expect(getHighlightCacheKey('x', 'ts', a)).not.toBe(getHighlightCacheKey('x', 'ts', b));
    expect(getHighlightCacheKey('x', 'ts', a)).not.toBe(getHighlightCacheKey('x', 'js', a));
  });

  it('turns tokens into light-dark styles', () => {
    expect(getTokenStyle({ content: 'a' })).toBeUndefined();
    expect(getTokenStyle({ content: 'a', color: '#111', darkColor: '#eee' })).toEqual({
      color: 'light-dark(#111, #eee)',
    });
    expect(getTokenStyle({ content: 'a', color: '#111', fontStyle: 'bold' })).toEqual({
      color: '#111',
      fontWeight: 700,
    });
    expect(getTokenStyle({ content: 'a', fontStyle: 'italic' })).toEqual({ fontStyle: 'italic' });
  });

  it('splits plain code into lines', () => {
    expect(toPlainLines('a\n\nb')).toEqual([[{ content: 'a' }], [], [{ content: 'b' }]]);
  });

  it('caches sync results and swallows highlighter errors', () => {
    const highlighter = jest.fn(() => LINES);
    expect(highlightCode('const', 'ts', highlighter)).toBe(LINES);
    expect(highlightCode('const', 'ts', highlighter)).toBe(LINES);
    expect(highlighter).toHaveBeenCalledTimes(1);

    const failing: SyntaxHighlighter = () => {
      throw new Error('boom');
    };
    expect(highlightCode('x', 'ts', failing)).toBeNull();
  });

  it('dedupes in-flight async work and caches the result', async () => {
    const highlighter = jest.fn(async () => LINES);
    const first = highlightCode('a', 'ts', highlighter);
    const second = highlightCode('a', 'ts', highlighter);
    expect(first).toBe(second);
    await expect(first).resolves.toBe(LINES);
    expect(highlightCode('a', 'ts', highlighter)).toBe(LINES);
    expect(highlighter).toHaveBeenCalledTimes(1);

    const rejecting: SyntaxHighlighter = async () => {
      throw new Error('nope');
    };
    await expect(highlightCode('b', 'ts', rejecting)).resolves.toBeNull();
  });
});

describe('useHighlightedLines', () => {
  beforeEach(() => clearHighlightCache());

  it('returns nothing without a highlighter and sync lines immediately', () => {
    expect(renderHook(() => useHighlightedLines('a', 'ts', undefined)).result.current).toEqual({
      lines: null,
      pending: false,
    });
    const { result } = renderHook(() => useHighlightedLines('a', 'ts', () => LINES));
    expect(result.current).toEqual({ lines: LINES, pending: false });
  });

  it('drops stale async results when the code changes', async () => {
    const resolvers = new Map<string, (lines: HighlightedLines) => void>();
    const highlighter: SyntaxHighlighter = (code) =>
      new Promise((resolve) => {
        resolvers.set(code, resolve);
      });
    const { result, rerender } = renderHook(
      ({ code }) => useHighlightedLines(code, 'ts', highlighter),
      {
        initialProps: { code: 'old' },
      }
    );
    expect(result.current.pending).toBe(true);

    rerender({ code: 'new' });
    await act(async () => {
      resolvers.get('old')?.([[{ content: 'old' }]]);
    });
    expect(result.current).toEqual({ lines: null, pending: true });

    await act(async () => {
      resolvers.get('new')?.([[{ content: 'new' }]]);
    });
    await waitFor(() => expect(result.current.lines).toEqual([[{ content: 'new' }]]));
    expect(result.current.pending).toBe(false);
  });
});

describe('createShikiHighlighter', () => {
  it('maps light and dark variants and falls back to null', () => {
    const shiki: ShikiHighlighterLike = {
      codeToTokensWithThemes: (code, { lang }) => {
        if (lang === 'klingon') {
          throw new Error('Language not loaded');
        }
        return [
          [
            {
              content: code,
              variants: { light: { color: '#000', fontStyle: 1 }, dark: { color: '#fff' } },
            },
          ],
        ];
      },
    };
    const highlighter = createShikiHighlighter(shiki, { light: 'light-theme', dark: 'dark-theme' });
    expect(highlighter('x', 'TS')).toEqual([
      [{ content: 'x', color: '#000', darkColor: '#fff', fontStyle: 'italic' }],
    ]);
    expect(highlighter('x', 'text')).toBeNull();
    expect(highlighter('x', undefined)).toBeNull();
    expect(highlighter('x', 'klingon')).toBeNull();
  });

  it('accepts a highlighter typed with narrow language and theme unions, like shiki', () => {
    type Lang = 'ts' | 'tsx' | 'bash';
    type Theme = 'github-light' | 'github-dark' | { name: string; settings: unknown[] };
    interface ShikiLikeHighlighter {
      codeToTokensWithThemes: (
        code: string,
        options: { lang?: Lang | 'text'; themes: Partial<Record<string, Theme | 'none'>> }
      ) => Array<
        Array<{ content: string; variants: Record<string, { color?: string; fontStyle?: number }> }>
      >;
    }
    const shiki: ShikiLikeHighlighter = {
      codeToTokensWithThemes: (code) => [[{ content: code, variants: { light: {}, dark: {} } }]],
    };

    const highlighter = createShikiHighlighter(shiki, {
      light: 'github-light',
      dark: 'github-dark',
    });
    // @ts-expect-error theme names are checked against the highlighter's themes
    createShikiHighlighter(shiki, { light: 'solarized', dark: 'github-dark' });
    expect(highlighter('x', 'ts')).toEqual([
      [{ content: 'x', color: undefined, darkColor: undefined, fontStyle: undefined }],
    ]);
  });
});
