import React from 'react';
import { render, screen, userEvent } from '@mantine-tests/core';
import type { CommandHelpItem, ShortcutHelpItem } from '../types';
import { CommandsHelp } from './CommandsHelp';

const commands: CommandHelpItem[] = [
  { name: 'review', description: 'Review changes', args: '<path>', group: 'Git' },
  { name: 'compact', description: 'Summarize the conversation', group: 'Session' },
  { name: 'clear', description: 'Start over', group: 'Session' },
];

const shortcuts: ShortcutHelpItem[] = [
  { keys: 'mod+K', description: 'Open command palette', group: 'General' },
  { keys: ['shift', 'enter'], description: 'New line', group: 'Composer' },
];

describe('help/CommandsHelp', () => {
  it('lists grouped commands and filters them with fuzzy search', async () => {
    render(<CommandsHelp commands={commands} shortcuts={shortcuts} />);

    expect(screen.getByRole('group', { name: 'Session' })).toBeInTheDocument();
    expect(screen.getByText('/review <path>')).toBeInTheDocument();

    await userEvent.type(screen.getByRole('textbox'), 'cmpct');
    expect(screen.getByText('/compact')).toBeInTheDocument();
    expect(screen.queryByText('/review <path>')).not.toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Commands \(1\)/ })).toBeInTheDocument();

    await userEvent.clear(screen.getByRole('textbox'));
    await userEvent.type(screen.getByRole('textbox'), 'zzzz');
    expect(screen.getAllByText('Nothing found').length).toBeGreaterThan(0);
  });

  it('shows shortcuts and selects commands', async () => {
    const onCommandSelect = jest.fn();
    render(
      <CommandsHelp commands={commands} shortcuts={shortcuts} onCommandSelect={onCommandSelect} />
    );

    await userEvent.click(screen.getByRole('button', { name: /\/clear/ }));
    expect(onCommandSelect).toHaveBeenCalledWith(expect.objectContaining({ name: 'clear' }));

    await userEvent.click(screen.getByRole('tab', { name: /Shortcuts/ }));
    expect(screen.getByText('Open command palette')).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Composer' })).toBeInTheDocument();
  });

  it('hides the tabs without shortcuts', () => {
    render(<CommandsHelp commands={commands} />);
    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
  });
});
