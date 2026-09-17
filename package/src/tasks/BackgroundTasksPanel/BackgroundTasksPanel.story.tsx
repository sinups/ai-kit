import React, { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from '@storybook/test';
import { Box, Group, Paper, Stack, Text } from '@mantine/core';
import { NARROW_WIDTH, WIDE_WIDTH, WidthFrame } from '../../_stories/WidthFrame';
import { useSimulatedTasks } from '../_stories/use-simulated-tasks';
import { createTaskFixtures } from '../fixtures';
import { TaskStatusPill } from '../TaskStatusPill/TaskStatusPill';
import { BackgroundTasksDrawer } from './BackgroundTasksDrawer';
import { BackgroundTasksPanel, type BackgroundTasksPanelProps } from './BackgroundTasksPanel';

export default { title: 'tasks/BackgroundTasksPanel' };

function Demo(props: Partial<BackgroundTasksPanelProps>) {
  const { tasks, stop, retry, remove, steer } = useSimulatedTasks();
  return (
    <Paper withBorder radius="md" h={620}>
      <BackgroundTasksPanel
        tasks={tasks}
        onStop={stop}
        onRetry={retry}
        onRemove={remove}
        onSteer={steer}
        defaultSelectedId="review-agent"
        {...props}
      />
    </Paper>
  );
}

export function Usage() {
  return (
    <Box p="xl">
      <Demo />
    </Box>
  );
}

export function Narrow() {
  return (
    <WidthFrame width={NARROW_WIDTH}>
      <Demo defaultSelectedId={null} />
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
    <WidthFrame width={WIDE_WIDTH}>
      <Demo tasks={[]} loading defaultSelectedId={null} />
    </WidthFrame>
  );
}

export function LoadError() {
  return (
    <WidthFrame width={WIDE_WIDTH}>
      <Demo
        tasks={[]}
        error="Could not reach the task runner"
        onRetryLoad={() => {}}
        defaultSelectedId={null}
      />
    </WidthFrame>
  );
}

export function InDrawer() {
  const { tasks, stop, retry, remove, steer } = useSimulatedTasks();
  const [opened, setOpened] = useState(true);
  return (
    <Stack p="xl" maw={640}>
      <Paper withBorder radius="md" px="sm" py={6}>
        <Group justify="space-between" wrap="nowrap">
          <Text size="xs" c="dimmed">
            llama-3.3-70b · feat/invoices
          </Text>
          <TaskStatusPill tasks={tasks} onOpen={() => setOpened(true)} />
        </Group>
      </Paper>
      <BackgroundTasksDrawer
        opened={opened}
        onClose={() => setOpened(false)}
        tasks={tasks}
        onStop={stop}
        onRetry={retry}
        onRemove={remove}
        onSteer={steer}
      />
    </Stack>
  );
}

type DrawerArgs = { onClose: () => void };
type FlowContext<A> = { canvasElement: HTMLElement; args: A };

function FlowDrawer({ onClose }: DrawerArgs) {
  const [tasks] = useState(() => createTaskFixtures());
  const [opened, setOpened] = useState(false);
  return (
    <Stack p="xl" maw={640}>
      <TaskStatusPill tasks={tasks} onOpen={() => setOpened(true)} />
      <BackgroundTasksDrawer
        opened={opened}
        onClose={() => {
          setOpened(false);
          onClose();
        }}
        tasks={tasks}
      />
    </Stack>
  );
}

export const DrawerFlow = {
  args: { onClose: fn() },
  render: (args: DrawerArgs) => <FlowDrawer {...args} />,
  play: async ({ canvasElement, args }: FlowContext<DrawerArgs>) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole('button', { name: '4 running · 1 queued · 1 failed' }));
    const dialog = await page.findByRole('dialog');
    const searchButton = await within(dialog).findByRole('button', { name: 'Search tasks' });
    await waitFor(() =>
      expect(canvasElement.ownerDocument.activeElement).toContainElement(searchButton)
    );
    await expect(searchButton).not.toHaveFocus();
    await userEvent.click(searchButton);
    const search = await within(dialog).findByRole('textbox', { name: 'Search tasks' });
    await userEvent.type(search, 'deploy');
    await waitFor(() => expect(within(dialog).getAllByRole('option')).toHaveLength(1));
    await userEvent.click(within(dialog).getByRole('option'));
    await expect(
      (await within(dialog).findAllByText(/Blocked by Review pull request #482/)).length
    ).toBeGreaterThan(0);
    await expect(within(dialog).getByRole('tab', { name: 'Output' })).toBeInTheDocument();

    await userEvent.keyboard('{Escape}');
    await expect(args.onClose).toHaveBeenCalled();
  },
};
