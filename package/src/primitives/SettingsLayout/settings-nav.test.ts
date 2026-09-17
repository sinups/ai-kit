import { filterSettingsNav, groupSettingsNav, type SettingsNavItem } from './settings-nav';

const SECTIONS: SettingsNavItem[] = [
  { id: 'general', label: 'General' },
  { id: 'models', label: 'Models', description: 'Default model and temperature', group: 'Agent' },
  { id: 'mcp', label: 'MCP servers', description: 'Connected tools', group: 'Integrations' },
  { id: 'skills', label: 'Skills', group: 'Agent' },
  { id: 'about', label: 'About' },
];

describe('primitives/filterSettingsNav', () => {
  it('returns every section for an empty or blank query', () => {
    expect(filterSettingsNav(SECTIONS, '')).toBe(SECTIONS);
    expect(filterSettingsNav(SECTIONS, '   ')).toBe(SECTIONS);
  });

  it('matches label and description case-insensitively', () => {
    expect(filterSettingsNav(SECTIONS, 'mcp').map((s) => s.id)).toEqual(['mcp']);
    expect(filterSettingsNav(SECTIONS, 'TEMPERATURE').map((s) => s.id)).toEqual(['models']);
  });

  it('requires every word to match somewhere', () => {
    expect(filterSettingsNav(SECTIONS, 'servers tools').map((s) => s.id)).toEqual(['mcp']);
    expect(filterSettingsNav(SECTIONS, 'servers model')).toEqual([]);
  });
});

describe('primitives/groupSettingsNav', () => {
  it('puts ungrouped items first and keeps group order of first appearance', () => {
    expect(
      groupSettingsNav(SECTIONS).map(({ group, items }) => [group, items.map((i) => i.id)])
    ).toEqual([
      [undefined, ['general', 'about']],
      ['Agent', ['models', 'skills']],
      ['Integrations', ['mcp']],
    ]);
  });

  it('omits the ungrouped bucket when every item has a group', () => {
    expect(groupSettingsNav([{ id: 'a', label: 'A', group: 'G' }])).toEqual([
      { group: 'G', items: [{ id: 'a', label: 'A', group: 'G' }] },
    ]);
  });
});
