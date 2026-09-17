import { fuzzyFilter, fuzzyScore, splitByIndices } from './fuzzy';

describe('primitives/fuzzyScore', () => {
  it('matches a case-insensitive subsequence and returns indices', () => {
    expect(fuzzyScore('GS', 'git status')?.indices).toEqual([0, 4]);
    expect(fuzzyScore('opf', 'Open File')?.indices).toEqual([0, 1, 5]);
  });

  it('returns null when the query is not a subsequence', () => {
    expect(fuzzyScore('xyz', 'git status')).toBeNull();
    expect(fuzzyScore('statusx', 'status')).toBeNull();
  });

  it('returns an empty match for a blank query', () => {
    expect(fuzzyScore('  ', 'anything')).toEqual({ score: 0, indices: [] });
  });

  it('prefers word starts over scattered letters', () => {
    const match = fuzzyScore('nf', 'Info: New File');
    expect(match?.indices).toEqual([6, 10]);
  });

  it('treats camelCase humps as word starts', () => {
    expect(fuzzyScore('tc', 'toggleComments')?.indices).toEqual([0, 6]);
  });

  it('ranks prefixes and consecutive runs above scattered matches', () => {
    const prefix = fuzzyScore('set', 'Settings')!.score;
    const consecutive = fuzzyScore('set', 'Reset layout')!.score;
    const scattered = fuzzyScore('set', 'Unsaved note')!.score;
    expect(prefix).toBeGreaterThan(consecutive);
    expect(consecutive).toBeGreaterThan(scattered);
  });

  it('scores gaps longer than the penalty cap', () => {
    expect(fuzzyScore('ab', `a${'x'.repeat(40)} b`)?.indices).toEqual([0, 42]);
    expect(fuzzyScore('ab', 'x'.repeat(500))).toBeNull();
  });

  it('ignores whitespace inside the query', () => {
    expect(fuzzyScore('git st', 'git status')?.indices).toEqual([0, 1, 2, 4, 5]);
  });
});

describe('primitives/fuzzyFilter', () => {
  const items = [
    { name: 'Sort by date', tags: ['order'] },
    { name: 'Settings', tags: ['preferences'] },
    { name: 'Reset layout', tags: [] },
    { name: 'Close tab', tags: [] },
  ];

  it('keeps the original order for a blank query', () => {
    expect(fuzzyFilter(items, ' ', ['name']).map((result) => result.item)).toEqual(items);
  });

  it('drops non-matching items and sorts by score', () => {
    expect(fuzzyFilter(items, 'set', ['name']).map((result) => result.item.name)).toEqual([
      'Settings',
      'Close tab',
      'Reset layout',
    ]);
  });

  it('matches array and accessor keys and reports matches per key', () => {
    const results = fuzzyFilter(items, 'pref', ['name', 'tags', (item) => item.name.toUpperCase()]);
    expect(results).toHaveLength(1);
    expect(results[0].item.name).toBe('Settings');
    expect(results[0].matches).toEqual([null, [0, 1, 2, 3], null]);
  });

  it('ranks a label match above the same match in a later key', () => {
    const commands = [
      { label: 'Deploy', hint: 'theme' },
      { label: 'Theme', hint: 'deploy' },
    ];
    expect(fuzzyFilter(commands, 'theme', ['label', 'hint'])[0].item.label).toBe('Theme');
  });
});

describe('primitives/splitByIndices', () => {
  it('groups consecutive highlighted characters', () => {
    expect(splitByIndices('Open File', [0, 1, 5])).toEqual([
      { text: 'Op', highlighted: true },
      { text: 'en ', highlighted: false },
      { text: 'F', highlighted: true },
      { text: 'ile', highlighted: false },
    ]);
  });

  it('returns the text as one part without indices', () => {
    expect(splitByIndices('Open', [])).toEqual([{ text: 'Open', highlighted: false }]);
  });
});
