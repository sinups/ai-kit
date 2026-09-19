import React, { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from '@storybook/test';
import { Paper, Stack } from '@mantine/core';
import { NARROW_WIDTH, WIDE_WIDTH, WidthFrame } from '../../_stories/WidthFrame';
import { useSimulatedTasks } from '../_stories/use-simulated-tasks';
import { createTaskFixtures } from '../fixtures';
import { findTask } from '../task-utils';
import { TaskDetail } from './TaskDetail';

export default { title: 'Sessions & tasks/TaskDetail' };

function Demo({ id }: { id: string }) {
  const { tasks, stop, retry, steer } = useSimulatedTasks();
  const task = findTask(tasks, id);
  if (!task) {
    return null;
  }
  return (
    <Paper withBorder radius="md">
      <TaskDetail task={task} onStop={stop} onRetryTask={retry} onSteer={steer} />
    </Paper>
  );
}

export function Usage() {
  return (
    <Stack p="xl" maw={640}>
      <Demo id="review-agent" />
    </Stack>
  );
}

export function Narrow() {
  return (
    <WidthFrame width={NARROW_WIDTH}>
      <Demo id="review-agent" />
    </WidthFrame>
  );
}

export function Wide() {
  return (
    <WidthFrame width={WIDE_WIDTH}>
      <Demo id="review-agent" />
    </WidthFrame>
  );
}

export function LiveOutput() {
  return (
    <WidthFrame width={640}>
      <Demo id="dev-server" />
    </WidthFrame>
  );
}

export function Failed() {
  return (
    <WidthFrame width={640}>
      <Demo id="migration" />
    </WidthFrame>
  );
}

export function Queued() {
  return (
    <WidthFrame width={640}>
      <Demo id="deploy" />
    </WidthFrame>
  );
}

export function ShellWithAnsi() {
  return (
    <WidthFrame width={640}>
      <Demo id="lint" />
    </WidthFrame>
  );
}

export function JsonOutput() {
  return (
    <WidthFrame width={640}>
      <Demo id="format" />
    </WidthFrame>
  );
}

type SteerArgs = { onSteer: (taskId: string, text: string) => Promise<void> };
type FlowContext<A> = { canvasElement: HTMLElement; args: A };

function FlowDetail({ onSteer }: SteerArgs) {
  const [task] = useState(() => findTask(createTaskFixtures(), 'review-agent')!);
  return (
    <WidthFrame width={640}>
      <Paper withBorder radius="md">
        <TaskDetail task={task} onSteer={onSteer} />
      </Paper>
    </WidthFrame>
  );
}

export const TabsFlow = {
  args: { onSteer: fn(async () => {}) },
  render: (args: SteerArgs) => <FlowDetail {...args} />,
  play: async ({ canvasElement }: FlowContext<SteerArgs>) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Fetching pull request #482/)).toBeInTheDocument();

    await userEvent.click(canvas.getByRole('tab', { name: /Subtasks/ }));
    await expect(canvas.getByRole('tree')).toBeInTheDocument();
    await expect(canvas.getByText('Security scan')).toBeInTheDocument();

    await userEvent.click(canvas.getByRole('tab', { name: /Messages/ }));
    await expect(canvas.getByText('2 tests fail in invoice.test.ts')).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: 'Show message' }));
    await expect(canvas.getByRole('button', { name: 'Hide message' })).toHaveAttribute(
      'aria-expanded',
      'true'
    );

    await userEvent.click(canvas.getByRole('tab', { name: 'Output' }));
    await expect(canvas.getByText(/Fetching pull request #482/)).toBeInTheDocument();
  },
};

export const SteerFlow = {
  args: { onSteer: fn(async () => {}) },
  render: (args: SteerArgs) => <FlowDetail {...args} />,
  play: async ({ canvasElement, args }: FlowContext<SteerArgs>) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole('textbox', { name: 'Send instruction to this agent' });
    await expect(canvas.getByRole('button', { name: 'Send' })).toBeDisabled();
    await userEvent.type(field, 'Skip the legacy folder');
    await userEvent.click(canvas.getByRole('button', { name: 'Send' }));
    await expect(args.onSteer).toHaveBeenCalledWith('review-agent', 'Skip the legacy folder');
    await waitFor(() => expect(field).toHaveValue(''));
    await expect(canvas.queryByRole('alert')).not.toBeInTheDocument();
  },
};

export const SteerErrorFlow = {
  args: {
    onSteer: fn(async () => {
      throw new Error('The agent is waiting for approval');
    }),
  },
  render: (args: SteerArgs) => <FlowDetail {...args} />,
  play: async ({ canvasElement, args }: FlowContext<SteerArgs>) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole('textbox', { name: 'Send instruction to this agent' });
    await userEvent.type(field, 'Stop after the tests{Enter}');
    await expect(args.onSteer).toHaveBeenCalledWith('review-agent', 'Stop after the tests');
    await expect(await canvas.findByText('The agent is waiting for approval')).toBeInTheDocument();
    await expect(field).toHaveValue('Stop after the tests');
  },
};
