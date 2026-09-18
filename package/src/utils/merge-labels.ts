function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype
  );
}

/** Merges label objects left to right; nested sections merge key by key, strings and functions replace */
export function mergeLabels<T extends object>(
  ...sources: Array<Partial<T> | undefined>
): Partial<T> {
  const result: Record<string, unknown> = {};
  for (const source of sources) {
    if (!source) {
      continue;
    }
    for (const [key, value] of Object.entries(source)) {
      if (value === undefined) {
        continue;
      }
      const current = result[key];
      result[key] =
        isPlainObject(current) && isPlainObject(value) ? mergeLabels(current, value) : value;
    }
  }
  return result as Partial<T>;
}

/** Compares label objects by value: nested sections key by key, strings and functions by identity */
export function sameLabels(a: unknown, b: unknown): boolean {
  if (a === b) {
    return true;
  }
  if (!isPlainObject(a) || !isPlainObject(b)) {
    return false;
  }
  const keys = Object.keys(a);
  return keys.length === Object.keys(b).length && keys.every((key) => sameLabels(a[key], b[key]));
}
