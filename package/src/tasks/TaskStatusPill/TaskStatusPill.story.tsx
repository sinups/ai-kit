import React from 'react';
import { Group, Paper, Stack, Text } from '@mantine/core';
import { NARROW_WIDTH, WidthFrame } from '../../_stories/WidthFrame';
import { createTaskFixtures } from '../fixtures';
import { flattenTaskTree } from '../task-utils';
import type { BackgroundTask } from '../types';
import { TaskStatusPill } from './TaskStatusPill';

export default { title: 'tasks/TaskStatusPill' };

const ALL = flattenTaskTree(createTaskFixtures());
const COMPLETED: BackgroundTask[] = ALL.map((task) => ({ ...task, status: 'completed' }));
const RUNNING_ONLY = ALL.filter((task) => task.status === 'running');

function StatusBar({ tasks, label }: { tasks: BackgroundTask[]; label: string }) {
  return (
    <Paper withBorder radius="md" px="sm" py={6}>
      <Group justify="space-between" wrap="nowrap">
        <Text size="xs" c="dimmed" truncate>
          {label}
        </Text>
        <TaskStatusPill tasks={tasks} onOpen={() => {}} showWhenEmpty />
      </Group>
    </Paper>
  );
}

export function Usage() {
  return (
    <Stack p="xl" maw={520} gap="sm">
      <StatusBar tasks={ALL} label="Running, queued and failed" />
      <StatusBar tasks={RUNNING_ONLY} label="Running only" />
      <StatusBar tasks={COMPLETED} label="Everything finished" />
      <StatusBar tasks={[]} label="No tasks" />
      <Group>
        <TaskStatusPill tasks={ALL} />
        <TaskStatusPill tasks={COMPLETED} />
      </Group>
    </Stack>
  );
}

export function Narrow() {
  return (
    <WidthFrame width={NARROW_WIDTH}>
      <StatusBar tasks={ALL} label="llama-3.3-70b · main" />
    </WidthFrame>
  );
}

export function Wide() {
  return (
    <WidthFrame width={900}>
      <StatusBar tasks={ALL} label="llama-3.3-70b · feat/invoices · 48.2k tokens" />
    </WidthFrame>
  );
}
