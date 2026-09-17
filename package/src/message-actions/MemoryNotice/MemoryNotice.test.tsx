import React from 'react';
import { render, screen, userEvent } from '@mantine-tests/core';
import { memoryPreview } from './memory-preview';
import { MemoryNotice } from './MemoryNotice';

describe('message-actions/MemoryNotice', () => {
  it('expands to the saved content and opens the memory', async () => {
    const onOpen = jest.fn();
    render(<MemoryNotice content="Use yarn, not npm" target="AGENTS.md" onOpen={onOpen} />);
    expect(screen.getByText('Saved to memory · AGENTS.md')).toBeInTheDocument();

    const toggle = screen.getByRole('button', { expanded: false });
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await userEvent.click(screen.getByRole('button', { name: 'Open' }));
    expect(onOpen).toHaveBeenCalled();
  });

  it('switches to the removed state after undo', async () => {
    const onUndo = jest.fn();
    render(<MemoryNotice content="Prefers tabs" onUndo={onUndo} />);

    await userEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(onUndo).toHaveBeenCalled();
    expect(await screen.findByText('Removed from memory')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Undo' })).not.toBeInTheDocument();
  });

  it('shows the first line without inline markdown in the collapsed preview', () => {
    render(<MemoryNotice content={'- Use **yarn**, not `npm`\n\nSecond line'} />);
    expect(screen.getByText('Use yarn, not npm')).toBeInTheDocument();
  });

  it.each([
    ['## Run **yarn** tests', 'Run yarn tests'],
    ['> _Prefers_ tabs over ~~spaces~~', 'Prefers tabs over spaces'],
    ['1. See [the guide](https://example.com) and ![logo](a.png)', 'See the guide and logo'],
    ['- [x] Keep `snake_case` names', 'Keep snake_case names'],
    ['Multiply 2 * 3 * 4', 'Multiply 2 * 3 * 4'],
  ])('strips markdown from %j', (input, expected) => {
    expect(memoryPreview(input)).toBe(expected);
  });
});
