import React from 'react';
import { render, screen, userEvent } from '@mantine-tests/core';
import { CommandToggles, DEFAULT_COMMAND_TOGGLES_LABELS } from './CommandToggles';

const commands = [
  { id: 'web search', label: 'Search', description: 'Look things up on the web first' },
  { id: 'image', label: 'Image' },
  { id: 'canvas', label: 'Canvas', disabled: true },
];

describe('input/CommandToggles', () => {
  it('picks a command and clears it on a second click', async () => {
    const user = userEvent.setup({ delay: null });
    const onChange = jest.fn();
    const { rerender } = render(
      <CommandToggles commands={commands} value={null} onChange={onChange} />
    );

    expect(screen.getByRole('group', { name: 'Commands' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Search' }));
    expect(onChange).toHaveBeenLastCalledWith('web search');

    rerender(<CommandToggles commands={commands} value="web search" onChange={onChange} />);
    expect(screen.getByRole('button', { name: 'Search' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Image' })).toHaveAttribute('aria-pressed', 'false');
    await user.click(screen.getByRole('button', { name: 'Search' }));
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it('describes a command on focus and keeps a disabled one inert', async () => {
    const user = userEvent.setup({ delay: null });
    const onChange = jest.fn();
    render(<CommandToggles commands={commands} value={null} onChange={onChange} />);

    await user.tab();
    const search = screen.getByRole('button', { name: 'Search' });
    expect(search).toHaveFocus();
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Look things up on the web first');
    expect(search).toHaveAccessibleDescription('Look things up on the web first');
    expect(screen.getByRole('button', { name: 'Canvas' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Canvas' }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('keeps its own choice when uncontrolled', async () => {
    const user = userEvent.setup({ delay: null });
    const onChange = jest.fn();
    render(<CommandToggles commands={commands} defaultValue="image" onChange={onChange} />);
    expect(screen.getByRole('button', { name: 'Image' })).toHaveAttribute('aria-pressed', 'true');
    await user.click(screen.getByRole('button', { name: 'Search' }));
    expect(screen.getByRole('button', { name: 'Search' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Image' })).toHaveAttribute('aria-pressed', 'false');
    expect(onChange).toHaveBeenCalledWith('web search');
  });

  it('keeps the English default and takes labels', () => {
    expect(DEFAULT_COMMAND_TOGGLES_LABELS.group).toBe('Commands');
    render(
      <CommandToggles
        commands={commands}
        value={null}
        onChange={() => {}}
        labels={{ group: 'Команды' }}
      />
    );
    expect(screen.getByRole('group', { name: 'Команды' })).toBeInTheDocument();
  });
});
