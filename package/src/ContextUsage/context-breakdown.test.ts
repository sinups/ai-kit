import {
  getBreakdownTotal,
  getColorVar,
  getGroupShade,
  getGroupTokens,
  sortBreakdownItems,
  sortSuggestions,
} from './context-breakdown';

describe('ContextUsage/context-breakdown', () => {
  it('sums groups from explicit tokens or items', () => {
    const groups = [
      { id: 'system', label: 'System', tokens: 3000 },
      {
        id: 'mcp',
        label: 'MCP tools',
        items: [
          { id: 'git', label: 'git', tokens: 8000 },
          { id: 'issues', label: 'issues', tokens: 4000 },
        ],
      },
    ];
    expect(getGroupTokens(groups[1])).toBe(12_000);
    expect(getBreakdownTotal(groups)).toBe(15_000);
    expect(getGroupShade(groups[0], 0)).toBe('gray.6');
    expect(getGroupShade({ ...groups[0], color: 'red' }, 0)).toBe('red.6');
    expect(getGroupShade(groups[0], 1)).toBe('blue.6');
    expect(getGroupShade({ ...groups[0], color: 'red.4' }, 0)).toBe('red.4');
  });

  it('resolves theme colors with or without a shade to a CSS variable', () => {
    expect(getColorVar('blue')).toBe('var(--mantine-color-blue-6)');
    expect(getColorVar('violet.5')).toBe('var(--mantine-color-violet-5)');
  });

  it('sorts items and suggestions', () => {
    expect(
      sortBreakdownItems([
        { id: 'a', label: 'a', tokens: 1 },
        { id: 'b', label: 'b', tokens: 5 },
        { id: 'c', label: 'c', tokens: 1 },
      ]).map((item) => item.id)
    ).toEqual(['b', 'a', 'c']);

    const suggestions = [
      { severity: 'info' as const, title: 'i', savings: 50_000 },
      { severity: 'warning' as const, title: 'w1', savings: 1000 },
      { severity: 'critical' as const, title: 'c' },
      { severity: 'warning' as const, title: 'w2', savings: 12_000 },
    ];
    expect(sortSuggestions(suggestions).map((item) => item.title)).toEqual(['c', 'w2', 'w1', 'i']);
  });
});
