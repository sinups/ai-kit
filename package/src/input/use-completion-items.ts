import React, { useEffect, useMemo, useState } from 'react';

export type CompletionItem = {
  value: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  group?: string;
};

export type CompletionSource = {
  /** Character sequence that opens the list, for example `/` or `@`. `/` only triggers at the start of a line */
  trigger: string;
  /** Static items filtered by the typed query, or a resolver called with the query */
  items: CompletionItem[] | ((query: string) => CompletionItem[] | Promise<CompletionItem[]>);
  /** Called after an item is inserted into the field */
  onSelect?: (item: CompletionItem) => void;
};

const EMPTY: CompletionItem[] = [];

function filterItems(items: CompletionItem[], query: string): CompletionItem[] {
  const needle = query.toLowerCase();
  if (!needle) {
    return items;
  }
  return items.filter(
    (item) => item.label.toLowerCase().includes(needle) || item.value.toLowerCase().includes(needle)
  );
}

function orderByGroup(items: CompletionItem[]): CompletionItem[] {
  const groups = new Map<string, CompletionItem[]>();
  for (const item of items) {
    const key = item.group ?? '';
    const bucket = groups.get(key);
    if (bucket) {
      bucket.push(item);
    } else {
      groups.set(key, [item]);
    }
  }
  return [...groups.values()].flat();
}

export function useCompletionItems(
  source: CompletionSource | undefined,
  query: string | null
): CompletionItem[] {
  const items = source?.items;
  const resolver = typeof items === 'function' ? items : null;
  const requestKey = source && query !== null ? `${source.trigger} ${query}` : '';
  const trigger = source?.trigger;
  const [resolved, setResolved] = useState<{
    key: string;
    trigger?: string;
    items: CompletionItem[];
  }>({ key: '', items: EMPTY });

  useEffect(() => {
    if (!resolver || query === null) {
      return;
    }
    let cancelled = false;
    Promise.resolve()
      .then(() => resolver(query))
      .then(
        (result) => {
          if (!cancelled) {
            setResolved({ key: requestKey, trigger, items: result ?? EMPTY });
          }
        },
        () => {
          if (!cancelled) {
            setResolved({ key: requestKey, trigger, items: EMPTY });
          }
        }
      );
    return () => {
      cancelled = true;
    };
  }, [resolver, query, requestKey, trigger]);

  return useMemo(() => {
    if (!items || query === null) {
      return EMPTY;
    }
    if (Array.isArray(items)) {
      return orderByGroup(filterItems(items, query));
    }
    if (resolved.key === requestKey) {
      return orderByGroup(resolved.items);
    }
    return resolved.trigger === trigger ? orderByGroup(filterItems(resolved.items, query)) : EMPTY;
  }, [items, query, resolved, requestKey, trigger]);
}
