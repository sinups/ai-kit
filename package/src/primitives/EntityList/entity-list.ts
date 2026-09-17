export interface EntityGroup<T> {
  key: string;
  items: T[];
}

export function filterEntities<T>(
  items: T[],
  query: string,
  filter?: (item: T, query: string) => boolean
): T[] {
  const trimmed = query.trim();
  if (!filter || !trimmed) {
    return items;
  }
  return items.filter((item) => filter(item, trimmed));
}

export function groupEntities<T>(
  items: T[],
  groupBy?: (item: T) => string,
  groupOrder: string[] = []
): EntityGroup<T>[] {
  if (!groupBy) {
    return [{ key: '', items }];
  }

  const groups = new Map<string, T[]>();
  for (const item of items) {
    const key = groupBy(item);
    const bucket = groups.get(key);
    if (bucket) {
      bucket.push(item);
    } else {
      groups.set(key, [item]);
    }
  }

  const ordered: EntityGroup<T>[] = [];
  for (const key of groupOrder) {
    const bucket = groups.get(key);
    if (bucket) {
      ordered.push({ key, items: bucket });
      groups.delete(key);
    }
  }
  for (const [key, bucket] of groups) {
    ordered.push({ key, items: bucket });
  }
  return ordered;
}

/** Index of the next enabled entry in `direction`, clamped to the ends; -1 when nothing is enabled */
export function findNextEnabledIndex(disabled: boolean[], from: number, direction: 1 | -1): number {
  for (let index = from + direction; index >= 0 && index < disabled.length; index += direction) {
    if (!disabled[index]) {
      return index;
    }
  }
  if (from >= 0 && from < disabled.length && !disabled[from]) {
    return from;
  }
  return -1;
}

export function findEdgeEnabledIndex(disabled: boolean[], edge: 'first' | 'last'): number {
  return edge === 'first'
    ? findNextEnabledIndex(disabled, -1, 1)
    : findNextEnabledIndex(disabled, disabled.length, -1);
}
