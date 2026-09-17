import React, { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from '@storybook/test';
import { Paper, Stack } from '@mantine/core';
import { NARROW_WIDTH, WIDE_WIDTH, WidthFrame } from '../../_stories/WidthFrame';
import { useSimulatedTasks } from '../_stories/use-simulated-tasks';
import { createTaskFixtures } from '../fixtures';
import type { BackgroundTask } from '../types';
import { TaskList, type TaskListProps } from './TaskList';

export default { title: 'tasks/TaskList' };

function Demo(props: Partial<TaskListProps>) {
  const { tasks, stop, retry, remove } = useSimulatedTasks();
  const [selectedId, setSelectedId] = useState<string | null>('review-agent');
  return (
    <Paper withBorder radius="md" p="sm">
      <TaskList
        tasks={tasks}
        selectedId={selectedId}
        onSelect={(task) => setSelectedId(task.id)}
        onStop={stop}
        onRetry={retry}
        onRemove={remove}
        {...props}
      />
    </Paper>
  );
}

export function Usage() {
  return (
    <Stack p="xl" maw={480}>
      <Demo />
    </Stack>
  );
}

export function Narrow() {
  return (
    <WidthFrame width={NARROW_WIDTH}>
      <Demo />
    </WidthFrame>
  );
}

export function Wide() {
  return (
    <WidthFrame width={WIDE_WIDTH}>
      <Demo />
    </WidthFrame>
  );
}

export function Loading() {
  return (
    <WidthFrame width={480}>
      <Demo tasks={[]} loading />
    </WidthFrame>
  );
}

export function LoadError() {
  return (
    <WidthFrame width={480}>
      <Demo tasks={[]} error="Could not reach the task runner" onRetryLoad={() => {}} />
    </WidthFrame>
  );
}

export function Empty() {
  return (
    <WidthFrame width={480}>
      <Demo tasks={[]} />
    </WidthFrame>
  );
}

export function MaxVisible() {
  return (
    <WidthFrame width={NARROW_WIDTH}>
      <Demo maxVisible={3} />
    </WidthFrame>
  );
}

type ListArgs = {
  onSelect: (task: BackgroundTask) => void;
  onStop: (task: BackgroundTask) => void;
  onRetry: (task: BackgroundTask) => void;
  onRemove: (task: BackgroundTask) => void;
};
type FlowContext<A> = { canvasElement: HTMLElement; args: A };

const listArgs = (): ListArgs => ({ onSelect: fn(), onStop: fn(), onRetry: fn(), onRemove: fn() });

function FlowList({ maxVisible, ...args }: ListArgs & { maxVisible?: number }) {
  const [tasks] = useState(() => createTaskFixtures());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  return (
    <WidthFrame width={600}>
      <Paper withBorder radius="md" p="sm">
        <TaskList
          tasks={tasks}
          selectedId={selectedId}
          maxVisible={maxVisible}
          {...args}
          onSelect={(task) => {
            setSelectedId(task.id);
            args.onSelect(task);
          }}
        />
      </Paper>
    </WidthFrame>
  );
}

export const FilterAndSearchFlow = {
  args: listArgs(),
  render: (args: ListArgs) => <FlowList {...args} />,
  play: async ({ canvasElement, args }: FlowContext<ListArgs>) => {
    const canvas = within(canvasElement);
    await waitFor(() => expect(canvas.getAllByRole('option')).toHaveLength(7));
    const page = within(canvasElement.ownerDocument.body);
    const kind = await canvas.findByLabelText('Task kind');
    await userEvent.click(kind);
    await userEvent.click(await page.findByRole('option', { name: 'Shell (3)' }));
    await waitFor(() => expect(canvas.getAllByRole('option')).toHaveLength(3));
    await userEvent.click(kind);
    await userEvent.click(await page.findByRole('option', { name: 'All (7)' }));
    await waitFor(() => expect(canvas.getAllByRole('option')).toHaveLength(7));
    await userEvent.type(canvas.getByRole('textbox', { name: 'Search tasks' }), 'backfill');
    const [option] = canvas.getAllByRole('option');
    await expect(canvas.getAllByRole('option')).toHaveLength(1);
    await userEvent.click(option);
    await expect(args.onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'migration' }));
    await expect(option).toHaveAttribute('aria-selected', 'true');
    await userEvent.clear(canvas.getByRole('textbox', { name: 'Search tasks' }));
    await userEvent.type(canvas.getByRole('textbox', { name: 'Search tasks' }), 'nothing here');
    await expect(canvas.getByText('No matching tasks')).toBeInTheDocument();
  },
};

export const TaskActionsFlow = {
  args: listArgs(),
  render: (args: ListArgs) => <FlowList {...args} />,
  play: async ({ canvasElement, args }: FlowContext<ListArgs>) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    const actionsOf = (title: RegExp) =>
      within(canvas.getByRole('option', { name: title })).getByRole('button', {
        name: 'Task actions',
      });

    await userEvent.click(actionsOf(/^yarn dev/));
    await userEvent.click(await page.findByRole('menuitem', { name: 'Stop' }));
    await expect(args.onStop).toHaveBeenCalledWith(expect.objectContaining({ id: 'dev-server' }));

    await waitFor(() => expect(page.queryAllByRole('menuitem')).toHaveLength(0));
    await userEvent.click(actionsOf(/^Backfill invoice totals/));
    await userEvent.click(await page.findByRole('menuitem', { name: 'Retry' }));
    await expect(args.onRetry).toHaveBeenCalledWith(expect.objectContaining({ id: 'migration' }));

    await waitFor(() => expect(page.queryAllByRole('menuitem')).toHaveLength(0));
    await userEvent.click(actionsOf(/^yarn lint --fix/));
    await userEvent.click(await page.findByRole('menuitem', { name: 'Remove' }));
    await expect(args.onRemove).toHaveBeenCalledWith(expect.objectContaining({ id: 'lint' }));
    await expect(args.onSelect).not.toHaveBeenCalled();
  },
};

export const ShowAllTasksFlow = {
  args: listArgs(),
  render: (args: ListArgs) => <FlowList {...args} maxVisible={2} />,
  play: async ({ canvasElement }: FlowContext<ListArgs>) => {
    const canvas = within(canvasElement);
    await waitFor(() => expect(canvas.getAllByRole('option')).toHaveLength(2));
    await expect(canvas.getByText('+1 pending, 4 done')).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: 'Show all' }));
    await expect(canvas.getAllByRole('option')).toHaveLength(7);
    await userEvent.click(canvas.getByRole('button', { name: 'Show fewer' }));
    await expect(canvas.getAllByRole('option')).toHaveLength(2);
  },
};
