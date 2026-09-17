import { useCallback, useEffect, useRef, useState } from 'react';
import { findDomMatches, stepMatchIndex } from './transcript-search';

const MATCH_HIGHLIGHT = 'ae-search-match';
const ACTIVE_HIGHLIGHT = 'ae-search-active';
const NO_MATCHES = { query: '', ranges: [] as Range[] };

type HighlightRegistry = {
  set: (name: string, value: unknown) => void;
  delete: (name: string) => void;
};

function getHighlights(): {
  registry: HighlightRegistry;
  create: (ranges: Range[]) => unknown;
} | null {
  const css = (globalThis as unknown as { CSS?: { highlights?: HighlightRegistry } }).CSS;
  const HighlightClass = (globalThis as { Highlight?: new (...ranges: Range[]) => unknown })
    .Highlight;
  if (!css?.highlights || !HighlightClass) {
    return null;
  }
  return {
    registry: css.highlights,
    create: (ranges) => new HighlightClass(...ranges),
  };
}

export interface TranscriptSearchState {
  query: string;
  setQuery: (query: string) => void;
  activeIndex: number;
  total: number;
  next: () => void;
  previous: () => void;
}

/** Finds the query in the text of `rootRef`, highlights matches and scrolls the active one into `scrollRef` */
export function useTranscriptSearch({
  enabled,
  rootRef,
  scrollRef,
  contentKey,
}: {
  enabled: boolean;
  rootRef: React.RefObject<HTMLElement | null>;
  scrollRef: React.RefObject<HTMLElement | null>;
  contentKey: unknown;
}): TranscriptSearchState {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const [matches, setMatches] = useState<{ query: string; ranges: Range[] }>(NO_MATCHES);
  const ownsHighlightsRef = useRef(false);
  const scrolledToRef = useRef<string | null>(null);

  const clearHighlights = useCallback(() => {
    if (!ownsHighlightsRef.current) {
      return;
    }
    ownsHighlightsRef.current = false;
    const highlights = getHighlights();
    highlights?.registry.delete(MATCH_HIGHLIGHT);
    highlights?.registry.delete(ACTIVE_HIGHLIGHT);
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!enabled || !root || !query.trim()) {
      setMatches(NO_MATCHES);
      setActiveIndex(-1);
      clearHighlights();
      return;
    }
    const found = findDomMatches(root, query);
    setMatches({ query, ranges: found });
    setActiveIndex((current) =>
      found.length === 0 ? -1 : current < 0 || current >= found.length ? 0 : current
    );
    const highlights = getHighlights();
    if (highlights) {
      highlights.registry.set(MATCH_HIGHLIGHT, highlights.create(found));
      ownsHighlightsRef.current = true;
    }
  }, [enabled, query, contentKey, rootRef, clearHighlights]);

  useEffect(() => {
    const range = matches.ranges[activeIndex];
    const highlights = getHighlights();
    if (!range) {
      if (ownsHighlightsRef.current) {
        highlights?.registry.delete(ACTIVE_HIGHLIGHT);
      }
      scrolledToRef.current = null;
      return;
    }
    highlights?.registry.set(ACTIVE_HIGHLIGHT, highlights.create([range]));
    const target = `${matches.query}\n${activeIndex}`;
    const container = scrollRef.current;
    if (
      scrolledToRef.current === target ||
      !container ||
      typeof range.getBoundingClientRect !== 'function'
    ) {
      return;
    }
    scrolledToRef.current = target;
    const rect = range.getBoundingClientRect();
    const box = container.getBoundingClientRect();
    if (rect.top < box.top + box.height * 0.2 || rect.bottom > box.bottom - box.height * 0.2) {
      container.scrollTop += rect.top - box.top - box.height / 3;
    }
  }, [matches, activeIndex, scrollRef]);

  useEffect(() => clearHighlights, [clearHighlights]);

  const total = matches.ranges.length;
  const next = useCallback(
    () => setActiveIndex((current) => stepMatchIndex(current, total, 1)),
    [total]
  );
  const previous = useCallback(
    () => setActiveIndex((current) => stepMatchIndex(current, total, -1)),
    [total]
  );

  return { query, setQuery, activeIndex, total, next, previous };
}
