import React, { useState } from 'react';
import { fireEvent, renderHook, waitFor } from '@testing-library/react';
import { render, screen, userEvent } from '@mantine-tests/core';
import type { PaletteCommand } from './command-palette';
import { CommandPalette } from './CommandPalette';
import { useFuzzySearch } from './use-fuzzy-search';

function commands(onRun: (id: string) => void): PaletteCommand[] {
  return [
    {
      id: 'new-chat',
      label: 'New chat',
      group: 'Chat',
      shortcut: 'mod+N',
      onSelect: () => onRun('new-chat'),
    },
    { id: 'archive', label: 'Archive chat', group: 'Chat', disabled: true },
    { id: 'theme', label: 'Toggle theme', group: 'Appearance', onSelect: () => onRun('theme') },
  ];
}

describe('CommandPalette', () => {
  beforeAll(() => {
    Element.prototype.scrollIntoView = jest.fn();
  });

  it('runs the active command with Enter, skipping disabled ones, and closes', async () => {
    const onRun = jest.fn();
    const onSelect = jest.fn();
    const onClose = jest.fn();
    render(
      <CommandPalette opened onClose={onClose} commands={commands(onRun)} onSelect={onSelect} />
    );

    const input = await screen.findByRole('combobox', { name: 'Search commands' });
    expect(screen.getByRole('group', { name: 'Chat' })).toBeInTheDocument();
    const options = screen.getAllByRole('option');
    expect(options[0]).toHaveAttribute('aria-selected', 'true');

    await userEvent.type(input, '{ArrowDown}');
    expect(options[2]).toHaveAttribute('aria-selected', 'true');
    expect(input).toHaveAttribute('aria-activedescendant', options[2].id);

    await userEvent.type(input, '{Enter}');
    expect(onRun).toHaveBeenCalledWith('theme');
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'theme' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('filters with fuzzy search and highlights matched characters', async () => {
    render(<CommandPalette opened onClose={() => {}} commands={commands(() => {})} />);

    const input = await screen.findByRole('combobox', { name: 'Search commands' });
    await userEvent.type(input, 'tgth');
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent('Toggle theme');
    expect(options[0].querySelectorAll('mark').length).toBeGreaterThan(0);

    await userEvent.clear(input);
    await userEvent.type(input, 'qqq');
    expect(screen.getByText('No commands found')).toBeInTheDocument();
  });

  it('shows recent commands while the query is empty and runs on click', async () => {
    const onRun = jest.fn();
    const onClose = jest.fn();
    render(
      <CommandPalette
        opened
        onClose={onClose}
        commands={commands(onRun)}
        recentIds={['theme']}
        labels={{ recent: 'Recently used' }}
      />
    );

    const recent = await screen.findByRole('group', { name: 'Recently used' });
    await userEvent.click(recent.querySelector('[role="option"]')!);
    expect(onRun).toHaveBeenCalledWith('theme');
    expect(onClose).toHaveBeenCalled();
  });

  it('does not run disabled commands on click', async () => {
    const onClose = jest.fn();
    render(<CommandPalette opened onClose={onClose} commands={commands(() => {})} />);

    fireEvent.click(await screen.findByText('Archive chat'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('opens with the hotkey and closes with Escape', async () => {
    function Controlled() {
      const [opened, setOpened] = useState(false);
      return (
        <CommandPalette
          opened={opened}
          onOpen={() => setOpened(true)}
          onClose={() => setOpened(false)}
          hotkey="mod+K"
          commands={commands(() => {})}
        />
      );
    }
    render(<Controlled />);

    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    fireEvent.keyDown(document.documentElement, { key: 'k', code: 'KeyK', ctrlKey: true });
    const input = await screen.findByRole('combobox', { name: 'Search commands' });

    await userEvent.type(input, '{Escape}');
    await waitFor(() => expect(screen.queryByRole('combobox')).not.toBeInTheDocument());
  });
  it('toggles with the hotkey and only closes without onOpen', async () => {
    const onOpen = jest.fn();
    const onClose = jest.fn();
    const pressHotkey = () =>
      fireEvent.keyDown(document.documentElement, { key: 'k', code: 'KeyK', ctrlKey: true });
    const { rerender } = render(
      <CommandPalette
        opened={false}
        onOpen={onOpen}
        onClose={onClose}
        hotkey="mod+K"
        commands={commands(() => {})}
      />
    );

    pressHotkey();
    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();

    rerender(
      <CommandPalette opened onClose={onClose} hotkey="mod+K" commands={commands(() => {})} />
    );
    await screen.findByRole('combobox', { name: 'Search commands' });
    pressHotkey();
    expect(onClose).toHaveBeenCalledTimes(1);

    rerender(
      <CommandPalette
        opened={false}
        onClose={onClose}
        hotkey="mod+K"
        commands={commands(() => {})}
      />
    );
    pressHotkey();
    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe('useFuzzySearch', () => {
  it('filters, sorts and limits results', () => {
    const items = [{ name: 'Reset layout' }, { name: 'Settings' }, { name: 'Sort by date' }];
    const keys = ['name' as const];
    const { result } = renderHook(() => useFuzzySearch({ items, keys, query: 'set', limit: 2 }));
    expect(result.current.map((entry) => entry.item.name)).toEqual(['Settings', 'Reset layout']);
  });
});
