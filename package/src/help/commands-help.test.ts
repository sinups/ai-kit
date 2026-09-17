import { formatCommandUsage, groupHelpItems, toPaletteCommands } from './commands-help';

describe('commands-help', () => {
  it('formats the command usage', () => {
    expect(formatCommandUsage({ name: 'review', args: ' <path> ' })).toBe('/review <path>');
    expect(formatCommandUsage({ name: '/init' })).toBe('/init');
  });

  it('groups items keeping ungrouped ones first', () => {
    const groups = groupHelpItems([
      { id: 1, group: 'Session' },
      { id: 2 },
      { id: 3, group: 'Git' },
      { id: 4, group: 'Session' },
    ]);
    expect(groups.map((group) => [group.group, group.items.map((item) => item.id)])).toEqual([
      [undefined, [2]],
      ['Session', [1, 4]],
      ['Git', [3]],
    ]);
  });

  it('converts commands to palette commands', () => {
    const onRun = jest.fn();
    const [review, compact] = toPaletteCommands(
      [
        {
          name: '/review',
          description: 'Review changes',
          args: '<path>',
          group: 'Git',
          shortcut: 'mod+shift+R',
        },
        { name: 'compact', description: 'Compact the conversation' },
      ],
      onRun
    );

    expect(review).toMatchObject({
      id: 'command:review',
      label: '/review',
      description: 'Review changes',
      group: 'Git',
      shortcut: 'mod+shift+R',
      keywords: ['review', '<path>'],
    });
    expect(compact.keywords).toEqual(['compact']);
    compact.onSelect?.();
    expect(onRun).toHaveBeenCalledWith(expect.objectContaining({ name: 'compact' }));
    expect(toPaletteCommands([{ name: 'x', description: '' }])[0].onSelect).toBeUndefined();
  });
});
