import React, { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from '@storybook/test';
import { failFirstCall, prepareFlow } from '../_stories/flow-helpers';
import { Button, Code, Stack } from '@mantine/core';
import { NARROW_WIDTH, WIDE_WIDTH, WidthFrame } from '../_stories/WidthFrame';
import { DISCOVERED_SERVERS } from './discovery-fixtures';
import { McpDiscoveredServers } from './McpDiscoveredServers';
import type { McpDiscoveredServer } from './types';

export default { title: 'MCP/McpDiscoveredServers' };

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function Demo({ fail = false }: { fail?: boolean }) {
  const [servers, setServers] = useState(DISCOVERED_SERVERS);
  const [log, setLog] = useState('');
  const decide = (verb: string) => async (picked: McpDiscoveredServer[]) => {
    await wait(700);
    if (fail) {
      throw new Error('.agent/settings.local.json is read-only');
    }
    setLog(`${verb}: ${picked.map((server) => server.name).join(', ')}`);
    setServers([]);
  };
  return (
    <Stack gap="sm">
      <McpDiscoveredServers
        key={servers.length}
        servers={servers}
        onApprove={decide('Approved')}
        onReject={decide('Rejected')}
      />
      {log && <Code block>{log}</Code>}
      {servers.length === 0 && (
        <Button size="xs" variant="default" onClick={() => setServers(DISCOVERED_SERVERS)}>
          Show again
        </Button>
      )}
    </Stack>
  );
}

export function Usage() {
  return (
    <Stack p="xl" maw={640}>
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

export function RejectedAction() {
  return (
    <WidthFrame width={WIDE_WIDTH}>
      <Demo fail />
    </WidthFrame>
  );
}

type DiscoveryCallback = (servers: McpDiscoveredServer[]) => void | Promise<void>;

interface DiscoveryFlowArgs {
  onApprove: DiscoveryCallback;
  onReject: DiscoveryCallback;
}

function FlowDiscovery({ onApprove, onReject }: DiscoveryFlowArgs) {
  const [servers, setServers] = useState(DISCOVERED_SERVERS);
  const [log, setLog] = useState('');
  const decide =
    (verb: string, callback: DiscoveryCallback) => async (picked: McpDiscoveredServer[]) => {
      await callback(picked);
      setLog(`${verb}: ${picked.map((server) => server.name).join(', ')}`);
      setServers([]);
    };
  return (
    <WidthFrame width={WIDE_WIDTH}>
      <Stack gap="sm">
        <McpDiscoveredServers
          servers={servers}
          onApprove={decide('Approved', onApprove)}
          onReject={decide('Rejected', onReject)}
        />
        {log && <Code block>{log}</Code>}
      </Stack>
    </WidthFrame>
  );
}

export const ApproveFlow = {
  args: {
    onApprove: failFirstCall('.mcp.json is read-only'),
    onReject: fn(),
  },
  render: (args: DiscoveryFlowArgs) => <FlowDiscovery {...args} />,
  play: async ({
    canvasElement,
    args,
  }: {
    canvasElement: HTMLElement;
    args: DiscoveryFlowArgs;
  }) => {
    prepareFlow();
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByText('Found 3 new MCP servers in this project')
    ).toBeInTheDocument();
    await expect(canvas.getByText('3 selected')).toBeInTheDocument();

    await userEvent.click(canvas.getByRole('checkbox', { name: 'errors' }));
    await userEvent.click(canvas.getByText('analytics-db'));
    await expect(await canvas.findByText('1 selected')).toBeInTheDocument();
    await expect(canvas.getByRole('checkbox', { name: 'Select all' })).toHaveAttribute(
      'data-indeterminate',
      'true'
    );

    await userEvent.click(canvas.getByRole('button', { name: 'Approve selected' }));
    await expect(await canvas.findByText('.mcp.json is read-only')).toBeInTheDocument();
    await expect(canvas.getByRole('checkbox', { name: 'playwright' })).toBeChecked();

    await userEvent.click(canvas.getByRole('button', { name: 'Approve selected' }));
    await waitFor(() => expect(args.onApprove).toHaveBeenCalledTimes(2));
    await expect(args.onApprove).toHaveBeenLastCalledWith([DISCOVERED_SERVERS[0]]);
    await expect(
      await canvas.findByText('Approved: playwright', {}, { timeout: 5000 })
    ).toBeInTheDocument();
    await expect(args.onReject).not.toHaveBeenCalled();
  },
};

export const RejectFlow = {
  args: { onApprove: fn(), onReject: fn(() => wait(200)) },
  render: (args: DiscoveryFlowArgs) => <FlowDiscovery {...args} />,
  play: async ({
    canvasElement,
    args,
  }: {
    canvasElement: HTMLElement;
    args: DiscoveryFlowArgs;
  }) => {
    prepareFlow();
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole('checkbox', { name: 'Select all' }));
    await expect(canvas.getByRole('button', { name: 'Approve selected' })).toBeDisabled();

    await userEvent.click(canvas.getByRole('button', { name: 'Reject' }));
    await expect(args.onReject).toHaveBeenCalledWith(DISCOVERED_SERVERS);
    await expect(
      await canvas.findByText('Rejected: playwright, errors, analytics-db', {}, { timeout: 5000 })
    ).toBeInTheDocument();
    await expect(args.onApprove).not.toHaveBeenCalled();
  },
};
