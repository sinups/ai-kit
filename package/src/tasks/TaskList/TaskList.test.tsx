import React from 'react';
import { render, screen, userEvent } from '@mantine-tests/core';
import { within } from '@testing-library/react';
import { createTaskFixtures } from '../fixtures';
import { TaskList } from './TaskList';

const NOW = new Date('2026-09-17T12:00:00Z').getTime();

describe('TaskList', () => {
  beforeAll(() => {
    Element.prototype.scrollIntoView = jest.fn();
  });

  it('groups tasks into Running, Queued and Finished', () => {
    render(<TaskList tasks={createTaskFixtures(NOW)} />);

    const groups = screen.getAllByRole('group');
    expect(groups.map((group) => group.firstElementChild?.textContent)).toEqual([
      'Running',
      'Queued',
      'Finished',
    ]);
    expect(within(groups[0]).getAllByRole('option')).toHaveLength(2);
    expect(within(groups[2]).getAllByRole('option')).toHaveLength(4);
    expect(screen.getByLabelText('2 Subtasks')).toBeInTheDocument();
    expect(screen.getByText('Failed')).toBeInTheDocument();
    expect(
      screen.queryByText('Running', { selector: '.mantine-Badge-label' })
    ).not.toBeInTheDocument();
    expect(screen.getByText('Batch 14 of 40 failed')).toBeInTheDocument();
  });

  it('filters by search query and selects a task', async () => {
    const onSelect = jest.fn();
    render(<TaskList tasks={createTaskFixtures(NOW)} onSelect={onSelect} />);

    await userEvent.type(screen.getByRole('textbox', { name: 'Search tasks' }), 'backfill');
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(1);
    await userEvent.click(options[0]);
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'migration' }));

    await userEvent.clear(screen.getByRole('textbox', { name: 'Search tasks' }));
    await userEvent.type(screen.getByRole('textbox', { name: 'Search tasks' }), 'nothing like it');
    expect(screen.getByText('No matching tasks')).toBeInTheDocument();
  });

  it('shows stop for running tasks and retry for failed ones', async () => {
    const onStop = jest.fn();
    const onRetry = jest.fn();
    const tasks = createTaskFixtures(NOW).filter((task) =>
      ['dev-server', 'migration'].includes(task.id)
    );
    render(<TaskList tasks={tasks} onStop={onStop} onRetry={onRetry} onRemove={jest.fn()} />);

    const [running, failed] = screen.getAllByRole('button', { name: 'Task actions' });
    await userEvent.click(running);
    expect(screen.queryByRole('menuitem', { name: 'Retry' })).not.toBeInTheDocument();
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Stop' }));
    expect(onStop).toHaveBeenCalledWith(expect.objectContaining({ id: 'dev-server' }));

    await userEvent.click(failed);
    expect(await screen.findByRole('menuitem', { name: 'Remove' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('menuitem', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalledWith(expect.objectContaining({ id: 'migration' }));
  });

  it('shows a rejected action in an alert', async () => {
    const onStop = jest.fn().mockRejectedValue(new Error('Process already exited'));
    const tasks = createTaskFixtures(NOW).filter((task) => task.id === 'dev-server');
    render(<TaskList tasks={tasks} onStop={onStop} />);

    await userEvent.click(screen.getByRole('button', { name: 'Task actions' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Stop' }));
    expect(await screen.findByText('Process already exited')).toBeInTheDocument();
  });

  it('renders the empty, loading and error states', async () => {
    const onRetryLoad = jest.fn();
    const { rerender } = render(<TaskList tasks={[]} />);
    expect(screen.getByText('No background tasks')).toBeInTheDocument();

    rerender(<TaskList tasks={[]} loading />);
    expect(document.querySelector('[aria-busy="true"]')).toBeInTheDocument();

    rerender(<TaskList tasks={[]} error="Could not load tasks" onRetryLoad={onRetryLoad} />);
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetryLoad).toHaveBeenCalled();
  });

  it('shows blockers, owners and highlights recently completed tasks', () => {
    render(<TaskList tasks={createTaskFixtures(Date.now())} />);

    expect(
      screen.getByText('Blocked by Review pull request #482', { exact: false })
    ).toBeInTheDocument();
    expect(document.querySelector('[data-owner="reviewer"]')).toHaveTextContent('reviewer');
    expect(document.querySelector('[data-owner="docs"]')).toBeInTheDocument();
    const recent = document.querySelectorAll('.recent');
    expect(recent).toHaveLength(1);
    expect(recent[0]).toHaveTextContent('yarn prettier --write');
  });

  it('limits visible tasks and summarizes the rest', async () => {
    render(<TaskList tasks={createTaskFixtures(NOW)} maxVisible={2} />);

    expect(screen.getAllByRole('option')).toHaveLength(2);
    expect(screen.getByText('+1 pending, 4 done')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Show all' }));
    expect(screen.getAllByRole('option')).toHaveLength(7);
    await userEvent.click(screen.getByRole('button', { name: 'Show fewer' }));
    expect(screen.getAllByRole('option')).toHaveLength(2);

    await userEvent.type(screen.getByRole('textbox', { name: 'Search tasks' }), 'yarn');
    expect(screen.getAllByRole('option')).toHaveLength(3);
  });
  it('drops the kind filter when no task of that kind is left', async () => {
    const tasks = createTaskFixtures(NOW);
    const { rerender } = render(<TaskList tasks={tasks} />);

    await userEvent.click(screen.getByRole('combobox', { name: 'Task kind' }));
    await userEvent.click(screen.getByRole('option', { name: /Shell/ }));
    const list = screen.getByRole('listbox', { name: 'Background tasks' });
    expect(within(list).getAllByRole('option')).toHaveLength(
      tasks.filter((task) => task.kind === 'shell').length
    );

    const agents = tasks.filter((task) => task.kind === 'agent');
    rerender(<TaskList tasks={agents} />);
    expect(screen.queryByRole('combobox', { name: 'Task kind' })).not.toBeInTheDocument();
    expect(screen.getAllByRole('option')).toHaveLength(agents.length);
  });
});
