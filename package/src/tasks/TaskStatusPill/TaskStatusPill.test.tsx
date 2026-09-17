import React from 'react';
import { render, screen, userEvent } from '@mantine-tests/core';
import type { BackgroundTask } from '../types';
import { TaskStatusPill } from './TaskStatusPill';

const task = (id: string, status: BackgroundTask['status']): BackgroundTask => ({
  id,
  kind: 'shell',
  title: id,
  status,
});

describe('TaskStatusPill', () => {
  it('summarizes running and failed tasks and opens on click', async () => {
    const onOpen = jest.fn();
    render(
      <TaskStatusPill
        tasks={[task('a', 'running'), task('b', 'running'), task('c', 'failed')]}
        onOpen={onOpen}
      />
    );

    const button = screen.getByRole('button', { name: '2 running · 1 failed' });
    expect(button).toHaveAttribute('data-busy', 'true');
    expect(screen.getByText('1 failed').tagName).toBe('SPAN');
    expect(screen.queryByText('2 running')).not.toBeInTheDocument();
    await userEvent.click(button);
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('renders a status badge without onOpen and falls back to the done count', () => {
    render(<TaskStatusPill tasks={[task('a', 'completed'), task('b', 'completed')]} />);
    expect(screen.getByRole('status')).toHaveTextContent('2 done');
  });

  it('renders nothing when empty unless asked to', () => {
    const { rerender } = render(<TaskStatusPill tasks={[]} />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();

    rerender(<TaskStatusPill tasks={[]} showWhenEmpty labels={{ pillEmpty: 'Idle' }} />);
    expect(screen.getByRole('status')).toHaveTextContent('Idle');
  });

  it('counts subtasks unless countSubtasks is false', () => {
    const tree: BackgroundTask[] = [
      { ...task('parent', 'running'), children: [task('a', 'running'), task('b', 'failed')] },
    ];
    const { rerender } = render(<TaskStatusPill tasks={tree} />);
    expect(screen.getByRole('status')).toHaveTextContent('2 running · 1 failed');

    rerender(<TaskStatusPill tasks={tree} countSubtasks={false} />);
    expect(screen.getByRole('status')).toHaveTextContent('1 running');
  });
});
