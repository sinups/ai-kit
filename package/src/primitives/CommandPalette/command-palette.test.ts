import { buildPaletteSections, type PaletteCommand } from './command-palette';

const COMMANDS: PaletteCommand[] = [
  { id: 'new-chat', label: 'New chat', group: 'Chat' },
  { id: 'clear', label: 'Clear conversation', group: 'Chat', keywords: ['reset'] },
  { id: 'theme', label: 'Toggle theme', group: 'Appearance' },
  { id: 'help', label: 'Help' },
];

describe('buildPaletteSections', () => {
  it('lists recent commands first and then groups in order of appearance', () => {
    const sections = buildPaletteSections(COMMANDS, '', ['theme', 'missing', 'new-chat']);
    expect(sections.map((section) => section.label)).toEqual([
      'Recent',
      'Chat',
      'Appearance',
      undefined,
    ]);
    expect(sections[0].entries.map((entry) => entry.command.id)).toEqual(['theme', 'new-chat']);
    const keys = sections.flatMap((section) => section.entries.map((entry) => entry.key));
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('omits the recent section when there are no recent commands', () => {
    expect(buildPaletteSections(COMMANDS, '')[0].label).toBe('Chat');
  });

  it('searches labels and keywords and returns label indices', () => {
    const sections = buildPaletteSections(COMMANDS, 'reset', ['theme']);
    expect(sections).toHaveLength(1);
    expect(sections[0].entries[0].command.id).toBe('clear');
    expect(sections[0].entries[0].labelIndices).toEqual([]);

    const theme = buildPaletteSections(COMMANDS, 'tt', []);
    expect(theme[0].entries[0].command.id).toBe('theme');
    expect(theme[0].entries[0].labelIndices).toEqual([0, 7]);
  });
});
