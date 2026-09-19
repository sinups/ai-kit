import React, { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from '@storybook/test';
import { Badge, Box, Code, NavLink, Stack, Text, Title } from '@mantine/core';
import { IconServer } from '@tabler/icons-react';
import { NARROW_WIDTH, WIDE_WIDTH, WidthFrame } from '../../_stories/WidthFrame';
import { MasterDetail, type MasterDetailProps } from './MasterDetail';

export default { title: 'Primitives/MasterDetail' };

const SERVERS = Array.from({ length: 24 }, (_, index) => ({
  id: `server-${index + 1}`,
  name: ['repo', 'tracker', 'postgres', 'filesystem', 'errors', 'chat'][index % 6],
  status: index % 5 === 0 ? 'error' : 'connected',
  tools: 3 + (index % 7),
}));

function Demo(props: Partial<MasterDetailProps> & { initialId?: string | null }) {
  const { initialId = null, ...rest } = props;
  const [selectedId, setSelectedId] = useState<string | null>(initialId);
  const selected = SERVERS.find((server) => server.id === selectedId);

  return (
    <MasterDetail
      list={
        <Stack gap={2} p="xs">
          {SERVERS.map((server) => (
            <NavLink
              key={server.id}
              component="button"
              type="button"
              label={server.name}
              description={`${server.tools} tools`}
              leftSection={<IconServer size={16} />}
              rightSection={
                <Badge
                  size="xs"
                  variant="light"
                  color={server.status === 'error' ? 'red' : 'green'}
                >
                  {server.status}
                </Badge>
              }
              active={server.id === selectedId}
              onClick={() => setSelectedId(server.id)}
            />
          ))}
        </Stack>
      }
      detail={
        selected ? (
          <Stack p="lg" gap="sm">
            <Title order={3}>{selected.name}</Title>
            <Text size="sm" c="dimmed">
              {selected.tools} tools, {selected.status}
            </Text>
            <Code block>{JSON.stringify(selected, null, 2)}</Code>
          </Stack>
        ) : null
      }
      onBack={() => setSelectedId(null)}
      {...rest}
    />
  );
}

export function Usage() {
  return (
    <Box h="100vh">
      <Demo resizable />
    </Box>
  );
}

export function Narrow() {
  return (
    <WidthFrame width={NARROW_WIDTH}>
      <Box h={520}>
        <Demo />
      </Box>
    </WidthFrame>
  );
}

export function NarrowDetail() {
  return (
    <WidthFrame width={NARROW_WIDTH}>
      <Box h={520}>
        <Demo initialId="server-3" />
      </Box>
    </WidthFrame>
  );
}

export function Wide() {
  return (
    <WidthFrame width={WIDE_WIDTH}>
      <Box h={520}>
        <Demo initialId="server-2" />
      </Box>
    </WidthFrame>
  );
}

export function WideEmpty() {
  return (
    <WidthFrame width={WIDE_WIDTH}>
      <Box h={520}>
        <Demo />
      </Box>
    </WidthFrame>
  );
}

export function Resizable() {
  return (
    <WidthFrame width={WIDE_WIDTH}>
      <Box h={520}>
        <Demo initialId="server-1" resizable listWidth={280} />
      </Box>
    </WidthFrame>
  );
}

type FlowArgs = { onSelect: (id: string) => void; onBack: () => void };

function FlowDemo({ args }: { args: FlowArgs }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = SERVERS.find((server) => server.id === selectedId);
  return (
    <WidthFrame width={NARROW_WIDTH}>
      <Box h={520}>
        <MasterDetail
          list={
            <Stack gap={2} p="xs">
              {SERVERS.slice(0, 6).map((server) => (
                <NavLink
                  key={server.id}
                  component="button"
                  type="button"
                  label={`${server.name} ${server.id}`}
                  onClick={() => {
                    setSelectedId(server.id);
                    args.onSelect(server.id);
                  }}
                />
              ))}
            </Stack>
          }
          detail={
            selected ? (
              <Stack p="lg" gap="sm">
                <Title order={3}>Details of {selected.id}</Title>
              </Stack>
            ) : null
          }
          onBack={() => {
            setSelectedId(null);
            args.onBack();
          }}
        />
      </Box>
    </WidthFrame>
  );
}

export const NarrowBackFlow = {
  args: { onSelect: fn(), onBack: fn() },
  render: (args: FlowArgs) => <FlowDemo args={args} />,
  play: async ({ canvasElement, args }: { canvasElement: HTMLElement; args: FlowArgs }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole('button', { name: /server-3/ }));
    await expect(args.onSelect).toHaveBeenCalledWith('server-3');
    await expect(
      await canvas.findByRole('heading', { name: 'Details of server-3' })
    ).toBeInTheDocument();
    await expect(canvas.queryByRole('button', { name: /server-1/ })).not.toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: 'Back' }));
    await expect(args.onBack).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(canvas.getByRole('button', { name: /server-1/ })).toBeInTheDocument()
    );
    await expect(canvas.queryByRole('heading', { name: /Details of/ })).not.toBeInTheDocument();
  },
};
