export type TextMatch = { start: number; end: number };

/** Case-insensitive, non-overlapping occurrences of `query` in `text` */
export function findTextMatches(text: string, query: string): TextMatch[] {
  const needle = query.trim().toLocaleLowerCase();
  if (!needle) {
    return [];
  }
  const haystack = text.toLocaleLowerCase();
  const matches: TextMatch[] = [];
  let index = haystack.indexOf(needle);
  while (index !== -1) {
    matches.push({ start: index, end: index + needle.length });
    index = haystack.indexOf(needle, index + needle.length);
  }
  return matches;
}

/** Next active match index, wrapping around; `-1` when there are no matches */
export function stepMatchIndex(current: number, total: number, direction: 1 | -1): number {
  if (total <= 0) {
    return -1;
  }
  if (current < 0) {
    return direction === 1 ? 0 : total - 1;
  }
  return (current + direction + total) % total;
}

/** Ranges of every match inside the text nodes of `root`, matching across adjacent text nodes */
export function findDomMatches(root: Node, query: string): Range[] {
  const doc = root.ownerDocument ?? (root as Document);
  const walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) =>
      node.parentElement?.closest('[data-search-ignore]')
        ? NodeFilter.FILTER_REJECT
        : NodeFilter.FILTER_ACCEPT,
  });
  const nodes: { node: Text; offset: number }[] = [];
  let text = '';
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    nodes.push({ node: node as Text, offset: text.length });
    text += (node as Text).data;
  }

  const locate = (position: number, isEnd: boolean) => {
    for (let i = nodes.length - 1; i >= 0; i -= 1) {
      const entry = nodes[i];
      const inside = isEnd ? position > entry.offset : position >= entry.offset;
      if (inside) {
        return { node: entry.node, offset: position - entry.offset };
      }
    }
    return null;
  };

  return findTextMatches(text, query).flatMap(({ start, end }) => {
    const from = locate(start, false);
    const to = locate(end, true);
    if (!from || !to) {
      return [];
    }
    const range = doc.createRange();
    range.setStart(from.node, from.offset);
    range.setEnd(to.node, to.offset);
    return [range];
  });
}
