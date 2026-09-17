import { useEffect, useState, type CSSProperties } from 'react';

export type HighlightToken = {
  content: string;
  color?: string;
  darkColor?: string;
  fontStyle?: 'italic' | 'bold' | 'underline';
};

export type HighlightedLines = HighlightToken[][];

/** Splits code into lines of tokens; `null` means the language is not supported and the code stays plain */
export type SyntaxHighlighter = (
  code: string,
  language: string | undefined
) => HighlightedLines | null | Promise<HighlightedLines | null>;

const CACHE_LIMIT = 300;
const cache = new Map<string, HighlightedLines | null>();
const inflight = new Map<string, Promise<HighlightedLines | null>>();
const highlighterIds = new WeakMap<SyntaxHighlighter, number>();
let nextHighlighterId = 1;

function getHighlighterId(highlighter: SyntaxHighlighter): number {
  let id = highlighterIds.get(highlighter);
  if (id === undefined) {
    id = nextHighlighterId++;
    highlighterIds.set(highlighter, id);
  }
  return id;
}

/** FNV-1a 32-bit hash, prefixed with the length to make collisions of different sizes impossible */
export function hashString(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `${value.length.toString(36)}:${(hash >>> 0).toString(36)}`;
}

export function getHighlightCacheKey(
  code: string,
  language: string | undefined,
  highlighter: SyntaxHighlighter
): string {
  return `${getHighlighterId(highlighter)}|${language ?? ''}|${hashString(code)}`;
}

function remember(key: string, lines: HighlightedLines | null) {
  if (cache.size >= CACHE_LIMIT) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) {
      cache.delete(oldest);
    }
  }
  cache.set(key, lines);
}

export function clearHighlightCache() {
  cache.clear();
  inflight.clear();
}

export function toPlainLines(code: string): HighlightedLines {
  return code.split('\n').map((line) => (line ? [{ content: line }] : []));
}

export function getTokenStyle(token: HighlightToken): CSSProperties | undefined {
  if (!token.color && !token.darkColor && !token.fontStyle) {
    return undefined;
  }
  const style: CSSProperties = {};
  if (token.color && token.darkColor) {
    style.color = `light-dark(${token.color}, ${token.darkColor})`;
  } else if (token.color || token.darkColor) {
    style.color = token.color ?? token.darkColor;
  }
  if (token.fontStyle === 'italic') {
    style.fontStyle = 'italic';
  } else if (token.fontStyle === 'bold') {
    style.fontWeight = 700;
  } else if (token.fontStyle === 'underline') {
    style.textDecoration = 'underline';
  }
  return style;
}

/** Runs the highlighter through the module cache; failures resolve to `null` */
export function highlightCode(
  code: string,
  language: string | undefined,
  highlighter: SyntaxHighlighter
): HighlightedLines | null | Promise<HighlightedLines | null> {
  const key = getHighlightCacheKey(code, language, highlighter);
  if (cache.has(key)) {
    return cache.get(key) ?? null;
  }
  const running = inflight.get(key);
  if (running) {
    return running;
  }
  let result: ReturnType<SyntaxHighlighter>;
  try {
    result = highlighter(code, language);
  } catch {
    remember(key, null);
    return null;
  }
  if (result && typeof (result as Promise<unknown>).then === 'function') {
    const promise = (result as Promise<HighlightedLines | null>)
      .then(
        (lines) => lines ?? null,
        () => null
      )
      .then((lines) => {
        inflight.delete(key);
        remember(key, lines);
        return lines;
      });
    inflight.set(key, promise);
    return promise;
  }
  const lines = (result as HighlightedLines | null) ?? null;
  remember(key, lines);
  return lines;
}

export interface HighlightedLinesState {
  /** Highlighted lines, `null` while pending, without a highlighter or for unsupported languages */
  lines: HighlightedLines | null;
  /** Whether an async highlight for the current code is running */
  pending: boolean;
}

/** Highlights code with a module-level cache; stale async results for older code are dropped */
export function useHighlightedLines(
  code: string,
  language: string | undefined,
  highlighter: SyntaxHighlighter | undefined
): HighlightedLinesState {
  const result = highlighter ? highlightCode(code, language, highlighter) : null;
  const key = highlighter ? getHighlightCacheKey(code, language, highlighter) : null;
  const [resolved, setResolved] = useState<{ key: string; lines: HighlightedLines | null } | null>(
    null
  );
  const promise = result instanceof Promise ? result : null;

  useEffect(() => {
    if (!promise || key === null) {
      return;
    }
    let active = true;
    promise.then((lines) => {
      if (active) {
        setResolved({ key, lines });
      }
    });
    return () => {
      active = false;
    };
  }, [promise, key]);

  if (!promise) {
    return { lines: result as HighlightedLines | null, pending: false };
  }
  if (resolved?.key === key) {
    return { lines: resolved.lines, pending: false };
  }
  return { lines: null, pending: true };
}

export type ShikiFontStyle = number | undefined;

/** Structural subset of a shiki highlighter, so the package does not depend on shiki */
export interface ShikiHighlighterLike<Lang extends string = string, Theme = string> {
  codeToTokensWithThemes: (
    code: string,
    options: { lang?: Lang; themes: Partial<Record<string, Theme>> }
  ) => Array<
    Array<{
      content: string;
      variants: Record<string, { color?: string; fontStyle?: ShikiFontStyle }>;
    }>
  >;
}

function fromShikiFontStyle(fontStyle: ShikiFontStyle): HighlightToken['fontStyle'] {
  if (!fontStyle || fontStyle < 0) {
    return undefined;
  }
  if (fontStyle & 2) {
    return 'bold';
  }
  if (fontStyle & 1) {
    return 'italic';
  }
  return fontStyle & 4 ? 'underline' : undefined;
}

const PLAIN_LANGUAGES = new Set(['', 'text', 'plain', 'plaintext', 'txt']);

/** Adapts a shiki highlighter created by the host, with a light and a dark theme */
export function createShikiHighlighter<Lang extends string, Theme>(
  shiki: ShikiHighlighterLike<Lang, Theme>,
  themes: { light: NoInfer<Theme> & string; dark: NoInfer<Theme> & string }
): SyntaxHighlighter {
  return (code, language) => {
    const lang = (language ?? '').trim().toLowerCase();
    if (PLAIN_LANGUAGES.has(lang)) {
      return null;
    }
    try {
      return shiki
        .codeToTokensWithThemes(code, {
          lang: lang as Lang,
          themes: { light: themes.light, dark: themes.dark },
        })
        .map((line) =>
          line.map((token) => {
            const light = token.variants.light ?? {};
            const dark = token.variants.dark ?? {};
            return {
              content: token.content,
              color: light.color,
              darkColor: dark.color,
              fontStyle: fromShikiFontStyle(light.fontStyle),
            };
          })
        );
    } catch {
      return null;
    }
  };
}
