import {
  filterEntities,
  findEdgeEnabledIndex,
  findNextEnabledIndex,
  groupEntities,
} from './entity-list';

const ITEMS = [
  { id: 'a', name: 'Alpha', kind: 'local' },
  { id: 'b', name: 'Beta', kind: 'remote' },
  { id: 'c', name: 'Gamma', kind: 'local' },
  { id: 'd', name: 'Delta', kind: 'plugin' },
];

describe('filterEntities', () => {
  const byName = (item: (typeof ITEMS)[number], query: string) =>
    item.name.toLowerCase().includes(query.toLowerCase());

  it('returns items unchanged without a filter or with a blank query', () => {
    expect(filterEntities(ITEMS, 'alp')).toBe(ITEMS);
    expect(filterEntities(ITEMS, '   ', byName)).toBe(ITEMS);
  });

  it('filters with a trimmed query', () => {
    expect(filterEntities(ITEMS, ' ta ', byName).map((item) => item.id)).toEqual(['b', 'd']);
  });
});

describe('groupEntities', () => {
  it('returns a single unnamed group without groupBy', () => {
    expect(groupEntities(ITEMS)).toEqual([{ key: '', items: ITEMS }]);
  });

  it('groups in order of appearance', () => {
    const groups = groupEntities(ITEMS, (item) => item.kind);
    expect(groups.map((group) => group.key)).toEqual(['local', 'remote', 'plugin']);
    expect(groups[0].items.map((item) => item.id)).toEqual(['a', 'c']);
  });

  it('puts groupOrder keys first and skips missing ones', () => {
    const groups = groupEntities(ITEMS, (item) => item.kind, ['plugin', 'missing', 'remote']);
    expect(groups.map((group) => group.key)).toEqual(['plugin', 'remote', 'local']);
  });
});

describe('findNextEnabledIndex', () => {
  const disabled = [false, true, false, true];

  it('skips disabled entries', () => {
    expect(findNextEnabledIndex(disabled, 0, 1)).toBe(2);
    expect(findNextEnabledIndex(disabled, 2, -1)).toBe(0);
  });

  it('stays on the current entry at the ends', () => {
    expect(findNextEnabledIndex(disabled, 2, 1)).toBe(2);
    expect(findNextEnabledIndex(disabled, 0, -1)).toBe(0);
  });

  it('finds the first and last enabled entries', () => {
    expect(findEdgeEnabledIndex(disabled, 'first')).toBe(0);
    expect(findEdgeEnabledIndex(disabled, 'last')).toBe(2);
    expect(findEdgeEnabledIndex([true, true], 'first')).toBe(-1);
  });
});
