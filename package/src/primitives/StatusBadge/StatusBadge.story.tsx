import React from 'react';
import { Group, Paper, Stack, Text } from '@mantine/core';
import { expect, within } from '@storybook/test';
import { NARROW_WIDTH, WIDE_WIDTH, WidthFrame } from '../../_stories/WidthFrame';
import { AGENT_UI_STATUSES, getStatusMeta } from './status-meta';
import { StatusBadge } from './StatusBadge';

export default { title: 'Primitives/StatusBadge' };

export function Usage() {
  return (
    <Stack p="xl" gap="lg">
      <Group gap="xs">
        {AGENT_UI_STATUSES.map((status) => (
          <StatusBadge key={status} status={status} />
        ))}
      </Group>
      <Group gap="lg">
        {AGENT_UI_STATUSES.map((status) => (
          <StatusBadge key={status} status={status} variant="dot" />
        ))}
      </Group>
      <Group gap="xs">
        {(['xs', 'sm', 'md', 'lg'] as const).map((size) => (
          <StatusBadge key={size} status="running" size={size} label={`Running ${size}`} />
        ))}
        <StatusBadge status="success" withIcon={false} />
      </Group>
    </Stack>
  );
}

const SERVERS = [
  { name: 'repo', status: 'success' as const, label: 'Connected' },
  { name: 'filesystem', status: 'running' as const, label: 'Connecting' },
  { name: 'tracker', status: 'needs-auth' as const },
  { name: 'postgres-with-a-very-long-name', status: 'error' as const, label: 'Failed to start' },
  { name: 'chat', status: 'disabled' as const },
];

function ServerRows({ variant }: { variant: 'badge' | 'dot' }) {
  return (
    <Paper withBorder radius="md" p="sm">
      <Stack gap="xs">
        {SERVERS.map((server) => (
          <Group key={server.name} justify="space-between" wrap="nowrap" gap="sm">
            <Text size="sm" truncate>
              {server.name}
            </Text>
            <StatusBadge status={server.status} label={server.label} variant={variant} />
          </Group>
        ))}
      </Stack>
    </Paper>
  );
}

export function Narrow() {
  return (
    <WidthFrame width={NARROW_WIDTH}>
      <Stack gap="md">
        <ServerRows variant="badge" />
        <ServerRows variant="dot" />
      </Stack>
    </WidthFrame>
  );
}

export function Wide() {
  return (
    <WidthFrame width={WIDE_WIDTH}>
      <Stack gap="md">
        <ServerRows variant="badge" />
        <ServerRows variant="dot" />
      </Stack>
    </WidthFrame>
  );
}

export function RenderFlow() {
  return (
    <Stack p="xl" gap="lg">
      <Group gap="xs" data-testid="badges">
        {AGENT_UI_STATUSES.map((status) => (
          <StatusBadge key={status} status={status} />
        ))}
      </Group>
      <Group gap="lg" data-testid="dots">
        {AGENT_UI_STATUSES.map((status) => (
          <StatusBadge key={status} status={status} variant="dot" />
        ))}
      </Group>
    </Stack>
  );
}

RenderFlow.play = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
  const canvas = within(canvasElement);
  for (const variant of ['badges', 'dots']) {
    const group = canvas.getByTestId(variant);
    for (const status of AGENT_UI_STATUSES) {
      const meta = getStatusMeta(status);
      const element = group.querySelector(`[data-status="${status}"]`) as HTMLElement;
      await expect(element).toBeInTheDocument();
      await expect(element).toHaveTextContent(meta.label);
      const hasLoader = element.querySelector('.mantine-Loader-root') !== null;
      await expect(hasLoader).toBe(meta.loading);
    }
  }
  const badges = canvas.getByTestId('badges');
  await expect(badges.querySelector('[data-status="success"] svg')).toBeInTheDocument();
  await expect(
    canvas.getByTestId('dots').querySelectorAll('.mantine-ColorSwatch-root')
  ).toHaveLength(AGENT_UI_STATUSES.filter((status) => !getStatusMeta(status).loading).length);
};
