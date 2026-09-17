import React from 'react';
import { render, screen, userEvent } from '@mantine-tests/core';
import { createTaskFixtures } from '../fixtures';
import { AgentTree } from './AgentTree';

const NOW = new Date('2026-09-17T12:00:00Z').getTime();
const tree = createTaskFixtures(NOW).slice(0, 1);

describe('tasks/AgentTree', () => {
  it('renders nested agents expanded with status and last activity', () => {
    render(<AgentTree tasks={tree} selectedId="tests-agent" />);

    expect(screen.getAllByRole('treeitem')).toHaveLength(4);
    expect(screen.getByText('yarn jest src/billing')).toBeInTheDocument();
    expect(screen.getByText('· No secrets or injection risks found')).toBeInTheDocument();
    expect(screen.getAllByText('Completed')).toHaveLength(1);
    const selected = screen
      .getAllByRole('treeitem')
      .find((item) => item.getAttribute('aria-selected') === 'true');
    expect(selected).toHaveAttribute('data-value', 'tests-agent');
  });

  it('collapses and expands a node without selecting it', async () => {
    const onSelect = jest.fn();
    render(<AgentTree tasks={tree} onSelect={onSelect} />);

    const [rootToggle] = screen.getAllByRole('button', { name: 'Collapse' });
    await userEvent.click(rootToggle);
    expect(screen.getAllByRole('treeitem')).toHaveLength(1);
    expect(onSelect).not.toHaveBeenCalled();

    await userEvent.click(screen.getAllByRole('button', { name: 'Expand' })[0]);
    expect(screen.getAllByRole('treeitem')).toHaveLength(4);
  });

  it('selects on click and with Enter', async () => {
    const onSelect = jest.fn();
    render(<AgentTree tasks={tree} onSelect={onSelect} />);

    await userEvent.click(screen.getByText('Security scan'));
    expect(onSelect).toHaveBeenLastCalledWith(expect.objectContaining({ id: 'security-agent' }));

    const root = screen.getAllByRole('treeitem')[0];
    root.focus();
    await userEvent.keyboard('{Enter}');
    expect(onSelect).toHaveBeenLastCalledWith(expect.objectContaining({ id: 'review-agent' }));
  });
});
