import React from 'react';
import { render, screen, userEvent } from '@mantine-tests/core';
import { setElementWidth } from '../../primitives/_testing/element-width';
import { createTaskFixtures } from '../fixtures';
import { BackgroundTasksDrawer } from './BackgroundTasksDrawer';
import { BackgroundTasksPanel } from './BackgroundTasksPanel';

const NOW = new Date('2026-09-17T12:00:00Z').getTime();
const tasks = createTaskFixtures(NOW);

describe('tasks/BackgroundTasksPanel', () => {
  beforeAll(() => {
    Element.prototype.scrollIntoView = jest.fn();
  });

  it('opens a task when narrow and goes back through subtasks', async () => {
    const onSelectedIdChange = jest.fn();
    render(<BackgroundTasksPanel tasks={tasks} onSelectedIdChange={onSelectedIdChange} />);

    await userEvent.click(screen.getByText('Review pull request #482'));
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Output' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('tab', { name: /Subtasks/ }));
    await userEvent.click(screen.getByText('Security scan'));
    expect(onSelectedIdChange).toHaveBeenLastCalledWith('security-agent');
    expect(screen.getByText('No findings')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'All tasks' }));
    expect(onSelectedIdChange).toHaveBeenLastCalledWith('review-agent');
    await userEvent.click(screen.getByRole('button', { name: 'All tasks' }));
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  describe('wide', () => {
    let restore: () => void;
    beforeEach(() => {
      restore = setElementWidth(1000);
    });
    afterEach(() => restore());

    it('shows the list and the detail side by side', async () => {
      render(<BackgroundTasksPanel tasks={tasks} defaultSelectedId="tests-shell" />);

      expect(await screen.findByRole('listbox')).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /^Review pull request/ })).toHaveAttribute(
        'aria-selected',
        'true'
      );
      expect(screen.getAllByText('yarn jest src/billing').length).toBeGreaterThan(0);
    });
  });

  it('renders inside a drawer with a status pill and marks the search for autofocus', async () => {
    render(<BackgroundTasksDrawer opened onClose={jest.fn()} tasks={tasks} />);
    expect(await screen.findByText('Background tasks')).toBeInTheDocument();
    expect(document.querySelector('.mantine-Drawer-inner')).toHaveClass('ae-overlay-inner');
    expect(document.querySelector('[data-autofocus="true"]')).toContainElement(
      screen.getByRole('button', { name: 'Search tasks' })
    );
    expect(screen.getByRole('status')).toHaveTextContent('4 running · 1 queued · 1 failed');
  });

  it('renders a header on the inner edge and a compact search toggle', async () => {
    render(<BackgroundTasksPanel tasks={tasks} header={<h2>Background tasks</h2>} compact />);
    expect(screen.getByRole('heading', { name: 'Background tasks' })).toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: 'Search tasks' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Search tasks' }));
    await userEvent.type(screen.getByRole('textbox', { name: 'Search tasks' }), 'lint');
    expect(screen.getAllByRole('option')).toHaveLength(1);
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('textbox', { name: 'Search tasks' })).not.toBeInTheDocument();
    expect(screen.getAllByRole('option').length).toBeGreaterThan(1);
  });
});
