import React from 'react';
import { render, screen, userEvent } from '@mantine-tests/core';
import { act, waitFor } from '@testing-library/react';
import { createTaskFixtures } from '../fixtures';
import type { BackgroundTask } from '../types';
import { TaskDetail } from './TaskDetail';

const NOW = new Date('2026-09-17T12:00:00Z').getTime();
const fixtures = createTaskFixtures(NOW);
const byId = (id: string) => fixtures.find((task) => task.id === id)!;

describe('tasks/TaskDetail', () => {
  it('renders the header with stats and the failure', async () => {
    const onRetryTask = jest.fn();
    render(<TaskDetail task={byId('migration')} onRetryTask={onRetryTask} onStop={jest.fn()} />);

    expect(screen.getByText('Backfill invoice totals')).toBeInTheDocument();
    expect(screen.getByText('Failed')).toBeInTheDocument();
    expect(screen.getByText('3m')).toBeInTheDocument();
    expect(screen.getByText('14 of 40 batches')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Connection to the staging database');
    expect(screen.queryByRole('button', { name: 'Stop' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetryTask).toHaveBeenCalledWith(expect.objectContaining({ id: 'migration' }));
  });

  it('shows tokens and tool uses and a pending stop', async () => {
    let resolve: () => void = () => {};
    const onStop = jest.fn(() => new Promise<void>((done) => (resolve = done)));
    render(<TaskDetail task={byId('review-agent')} onStop={onStop} />);

    expect(screen.getByText(/48\.2k tokens/)).toBeInTheDocument();
    expect(screen.getByText(/37 tool uses/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Stop' }));
    expect(screen.getByRole('button', { name: 'Stop' })).toHaveAttribute('data-loading', 'true');
    await act(async () => resolve());
    expect(screen.getByRole('button', { name: 'Stop' })).not.toHaveAttribute('data-loading');
  });

  it('does not carry a pending stop over to another task', async () => {
    const onStop = jest.fn(() => new Promise<void>(() => {}));
    const { rerender } = render(<TaskDetail task={byId('review-agent')} onStop={onStop} />);

    await userEvent.click(screen.getByRole('button', { name: 'Stop' }));
    expect(screen.getByRole('button', { name: 'Stop' })).toHaveAttribute('data-loading', 'true');

    rerender(<TaskDetail task={{ ...byId('review-agent'), id: 'other-agent' }} onStop={onStop} />);
    expect(screen.getByRole('button', { name: 'Stop' })).not.toHaveAttribute('data-loading');
  });

  it('shows the output with ANSI colors, a live state and exit code', () => {
    const { container, rerender } = render(
      <TaskDetail
        task={{ ...byId('dev-server'), output: '\x1b[32mready\x1b[0m on http://localhost:3000' }}
      />
    );
    expect(container.querySelector('[data-ansi-fg="green"]')).toHaveTextContent('ready');
    expect(screen.getByRole('link', { name: 'http://localhost:3000' })).toBeInTheDocument();
    expect(screen.getAllByText('Running').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Copy output' })).toBeInTheDocument();

    rerender(<TaskDetail task={{ ...byId('lint'), exitCode: 0 }} />);
    expect(screen.getByText('exit 0')).toBeInTheDocument();
  });

  it('sends an instruction to a running agent and keeps the text when it fails', async () => {
    const onSteer = jest
      .fn()
      .mockRejectedValueOnce(new Error('Agent is busy'))
      .mockResolvedValueOnce(undefined);
    render(<TaskDetail task={byId('review-agent')} onSteer={onSteer} />);

    const field = screen.getByRole('textbox', { name: 'Send instruction to this agent' });
    await userEvent.type(field, 'Skip the legacy folder{Enter}');
    expect(onSteer).toHaveBeenCalledWith('review-agent', 'Skip the legacy folder');
    expect(await screen.findByText('Agent is busy')).toBeInTheDocument();
    expect(field).toHaveValue('Skip the legacy folder');

    await userEvent.click(screen.getByRole('button', { name: 'Send' }));
    expect(onSteer).toHaveBeenCalledTimes(2);
    await waitFor(() => expect(field).toHaveValue(''));
  });

  it('hides the instruction field for shell and finished tasks', () => {
    const { rerender } = render(<TaskDetail task={byId('dev-server')} onSteer={jest.fn()} />);
    expect(screen.queryByRole('textbox', { name: 'Send instruction to this agent' })).toBeNull();
    rerender(<TaskDetail task={byId('docs-agent')} onSteer={jest.fn()} />);
    expect(screen.queryByRole('textbox', { name: 'Send instruction to this agent' })).toBeNull();
  });

  it('shows messages between agents', async () => {
    const task = {
      ...byId('review-agent'),
      messages: [
        {
          id: 'm1',
          from: { name: 'tests', color: 'teal' },
          to: { name: 'reviewer', color: 'grape' },
          summary: '2 tests fail in invoice.test.ts',
          content: 'Expected total 129.6, received 132',
        },
      ],
    };
    render(<TaskDetail task={task} />);
    await userEvent.click(screen.getByRole('tab', { name: /Messages/ }));
    expect(screen.getByText('2 tests fail in invoice.test.ts')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Show message' }));
    expect(screen.getByRole('button', { name: 'Hide message' })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
    expect(screen.getByText('Expected total 129.6, received 132')).toBeInTheDocument();
  });

  it('shows subtasks in a tree and reports the chosen one', async () => {
    const onSelectSubtask = jest.fn();
    render(<TaskDetail task={byId('review-agent')} onSelectSubtask={onSelectSubtask} />);

    await userEvent.click(screen.getByRole('tab', { name: /Subtasks/ }));
    expect(screen.getByRole('tree')).toBeInTheDocument();
    await userEvent.click(screen.getByText('Security scan'));
    expect(onSelectSubtask).toHaveBeenCalledWith(expect.objectContaining({ id: 'security-agent' }));
  });

  it('hides the subtasks tab and shows a placeholder without output', () => {
    const task: BackgroundTask = { id: 'x', kind: 'workflow', title: 'Deploy', status: 'queued' };
    render(<TaskDetail task={task} />);
    expect(screen.queryByRole('tab', { name: /Subtasks/ })).not.toBeInTheDocument();
    expect(screen.getByText('No output yet')).toBeInTheDocument();
  });

  it('names unfinished blockers of a queued task', () => {
    const all = createTaskFixtures(NOW);
    render(<TaskDetail task={all.find((task) => task.id === 'deploy')!} allTasks={all} />);
    expect(screen.getByText('Blocked by Review pull request #482')).toBeInTheDocument();
  });
});
