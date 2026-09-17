import { useMemo } from 'react';
import { fuzzyFilter, type FuzzyKey, type FuzzyResult } from './fuzzy';

export interface UseFuzzySearchOptions<T> {
  /** Items to search */
  items: T[];
  /** Fields or accessors to match, earlier keys rank higher; keep the array stable between renders */
  keys: FuzzyKey<T>[];
  /** Search query, a blank query returns all items in their original order */
  query: string;
  /** Maximum number of results */
  limit?: number;
}

export function useFuzzySearch<T>({
  items,
  keys,
  query,
  limit,
}: UseFuzzySearchOptions<T>): FuzzyResult<T>[] {
  return useMemo(() => {
    const results = fuzzyFilter(items, query, keys);
    return limit === undefined ? results : results.slice(0, limit);
  }, [items, keys, query, limit]);
}
