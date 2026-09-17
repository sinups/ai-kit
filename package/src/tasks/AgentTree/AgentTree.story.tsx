import React, { useState } from 'react';
import { expect, fn, userEvent, within } from '@storybook/test';
import { Paper, Stack } from '@mantine/core';
import { NARROW_WIDTH, WIDE_WIDTH, WidthFrame } from '../../_stories/WidthFrame';
import { useSimulatedTasks } from '../_stories/use-simulated-tasks';
import { createTaskFixtures } from '../fixtures';
import type { BackgroundTask } from '../types';
import { AgentTree } from './AgentTree';

export default { title: 'tasks/AgentTree' };

function Demo() {
  const { tasks } = useSimulatedTasks();
  const [selectedId, setSelectedId] = useState<string | null>('tests-agent');
  return (
    <Paper withBorder radius="md" p="xs">
      <AgentTree
        tasks={tasks.filter((task) => task.kind === 'agent')}
        selectedId={selectedId}
        onSelect={(task) => setSelectedId(task.id)}
      />
    </Paper>
  );
}

export function Usage() {
  return (
    <Stack p="xl" maw={520}>
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

type TreeArgs = { onSelect: (task: BackgroundTask) => void };
type FlowContext<A> = { canvasElement: HTMLElement; args: A };

function FlowTree({ onSelect }: TreeArgs) {
  const [tasks] = useState(() => createTaskFixtures().slice(0, 1));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  return (
    <Stack p="xl" maw={520}>
      <Paper withBorder radius="md" p="xs">
        <AgentTree
          tasks={tasks}
          selectedId={selectedId}
          onSelect={(task) => {
            setSelectedId(task.id);
            onSelect(task);
          }}
        />
      </Paper>
    </Stack>
  );
}

export const SelectFlow = {
  args: { onSelect: fn() },
  render: (args: TreeArgs) => <FlowTree {...args} />,
  play: async ({ canvasElement, args }: FlowContext<TreeArgs>) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole('treeitem')).toHaveLength(4);
    await userEvent.click(canvas.getByText('Security scan'));
    await expect(args.onSelect).toHaveBeenLastCalledWith(
      expect.objectContaining({ id: 'security-agent' })
    );
    const selected = canvas
      .getAllByRole('treeitem')
      .find((item) => item.getAttribute('aria-selected') === 'true');
    await expect(selected).toHaveAttribute('data-value', 'security-agent');

    const [collapseRoot] = canvas.getAllByRole('button', { name: 'Collapse' });
    await userEvent.click(collapseRoot);
    await expect(canvas.getAllByRole('treeitem')).toHaveLength(1);
    await userEvent.click(canvas.getByRole('button', { name: 'Expand' }));
    await expect(canvas.getAllByRole('treeitem')).toHaveLength(4);
  },
};

export const KeyboardFlow = {
  args: { onSelect: fn() },
  render: (args: TreeArgs) => <FlowTree {...args} />,
  play: async ({ canvasElement, args }: FlowContext<TreeArgs>) => {
    const canvas = within(canvasElement);
    const items = canvas.getAllByRole('treeitem');
    items[0].focus();
    await userEvent.keyboard('{ArrowDown}');
    await expect(items[1]).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await expect(args.onSelect).toHaveBeenLastCalledWith(
      expect.objectContaining({ id: 'tests-agent' })
    );
    await userEvent.keyboard('{ArrowLeft}');
    await expect(canvas.getAllByRole('treeitem')).toHaveLength(3);
    await userEvent.keyboard('{ArrowRight}');
    await expect(canvas.getAllByRole('treeitem')).toHaveLength(4);
  },
};
