import React, { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from '@storybook/test';
import { failFirstCall, prepareFlow } from '../_stories/flow-helpers';
import type { McpServer } from './types';
import { Stack } from '@mantine/core';
import { NARROW_WIDTH, WIDE_WIDTH, WidthFrame } from '../_stories/WidthFrame';
import { MCP_SERVERS } from './fixtures';
import { McpServerList, type McpServerListProps } from './McpServerList';

export default { title: 'MCP/McpServerList' };

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function Demo(props: Partial<McpServerListProps>) {
  const [selectedId, setSelectedId] = useState<string | null>('git');
  return (
    <McpServerList
      servers={MCP_SERVERS}
      selectedId={selectedId}
      onSelect={(server) => setSelectedId(server.id)}
      onAdd={() => {}}
      onReconnect={() => wait(600)}
      onAuthenticate={() => wait(600)}
      onEnable={() => wait(400)}
      onDisable={() => wait(400)}
      onRemove={() =>
        Promise.reject(new globalThis.Error('Project servers can only be removed from .mcp.json'))
      }
      {...props}
    />
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
    <WidthFrame width={NARROW_WIDTH}>
      <Demo servers={[]} loading />
    </WidthFrame>
  );
}

export function Error() {
  return (
    <WidthFrame width={NARROW_WIDTH}>
      <Demo
        servers={[]}
        error="Could not read ~/.agent/config.json: permission denied"
        onRetry={() => {}}
      />
    </WidthFrame>
  );
}

export function Empty() {
  return (
    <WidthFrame width={NARROW_WIDTH}>
      <Demo servers={[]} />
    </WidthFrame>
  );
}

type ServerCallback = (server: McpServer) => void | Promise<void>;

interface ListFlowArgs {
  onSelect: ServerCallback;
  onAuthenticate: ServerCallback;
  onEnable: ServerCallback;
  onDisable: ServerCallback;
  onReconnect: ServerCallback;
  onRemove: ServerCallback;
}

function FlowList(args: ListFlowArgs) {
  const [servers, setServers] = useState(MCP_SERVERS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  return (
    <WidthFrame width={WIDE_WIDTH}>
      <McpServerList
        servers={servers}
        selectedId={selectedId}
        onSelect={(server) => {
          setSelectedId(server.id);
          args.onSelect(server);
        }}
        onAuthenticate={args.onAuthenticate}
        onEnable={args.onEnable}
        onDisable={args.onDisable}
        onReconnect={args.onReconnect}
        onRemove={async (server) => {
          await args.onRemove(server);
          setServers((prev) => prev.filter((item) => item.id !== server.id));
        }}
      />
    </WidthFrame>
  );
}

async function chooseFilter(canvasElement: HTMLElement, label: RegExp) {
  const canvas = within(canvasElement);
  const page = within(canvasElement.ownerDocument.body);
  const radio = canvas.queryByRole('radio', { name: label });
  if (radio) {
    await userEvent.click(radio);
    return;
  }
  await userEvent.click(canvas.getByRole('combobox', { name: 'Filter servers' }));
  const listbox = within(await page.findByRole('listbox', { name: 'Filter servers' }));
  await userEvent.click(listbox.getByRole('option', { name: label }));
}

const optionNames = (root: HTMLElement): string[] =>
  Array.from(root.querySelectorAll('[role="option"]'), (option) => option.textContent ?? '');

export const FilterFlow = {
  args: {
    onSelect: fn(),
    onAuthenticate: fn(),
    onEnable: fn(),
    onDisable: fn(),
    onReconnect: fn(),
    onRemove: fn(),
  },
  render: (args: ListFlowArgs) => <FlowList {...args} />,
  play: async ({ canvasElement, args }: { canvasElement: HTMLElement; args: ListFlowArgs }) => {
    prepareFlow();
    const canvas = within(canvasElement);
    await expect(await canvas.findAllByRole('option')).toHaveLength(5);

    await chooseFilter(canvasElement, /Needs attention/);
    await waitFor(() => expect(canvas.getAllByRole('option')).toHaveLength(2));
    const attention = optionNames(canvasElement);
    await expect(attention.some((text) => text.includes('issues'))).toBe(true);
    await expect(attention.some((text) => text.includes('errors'))).toBe(true);

    await chooseFilter(canvasElement, /Disabled/);
    await waitFor(() => expect(canvas.getAllByRole('option')).toHaveLength(1));
    await expect(optionNames(canvasElement)[0]).toContain('postgres');

    await chooseFilter(canvasElement, /All/);
    await userEvent.type(canvas.getByRole('textbox', { name: 'Search servers' }), 'uvx');
    await waitFor(() => expect(canvas.getAllByRole('option')).toHaveLength(1));
    await userEvent.click(canvas.getByText('postgres'));
    await expect(args.onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'postgres' }));
    await expect(canvas.getByRole('option', { selected: true })).toHaveTextContent('postgres');
  },
};

export const ActionsFlow = {
  args: {
    onSelect: fn(),
    onAuthenticate: fn(),
    onEnable: fn(),
    onDisable: fn(() => Promise.reject(new globalThis.Error('Server is locked by policy'))),
    onReconnect: fn(),
    onRemove: fn(),
  },
  render: (args: ListFlowArgs) => <FlowList {...args} />,
  play: async ({ canvasElement, args }: { canvasElement: HTMLElement; args: ListFlowArgs }) => {
    prepareFlow();
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);

    await userEvent.click(await canvas.findByRole('button', { name: 'Server actions: issues' }));
    await expect(await page.findByRole('menuitem', { name: 'Reconnect' })).toBeInTheDocument();
    await userEvent.click(page.getByRole('menuitem', { name: 'Authenticate' }));
    await expect(args.onAuthenticate).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'issues' })
    );
    await waitFor(() => expect(page.queryByRole('menu')).not.toBeInTheDocument());

    await userEvent.click(canvas.getByRole('button', { name: 'Server actions: postgres' }));
    await userEvent.click(await page.findByRole('menuitem', { name: 'Enable' }));
    await expect(args.onEnable).toHaveBeenCalledWith(expect.objectContaining({ id: 'postgres' }));
    await waitFor(() => expect(page.queryByRole('menu')).not.toBeInTheDocument());

    await userEvent.click(canvas.getByRole('button', { name: 'Server actions: git' }));
    await userEvent.click(await page.findByRole('menuitem', { name: 'Disable' }));
    await expect(args.onDisable).toHaveBeenCalledWith(expect.objectContaining({ id: 'git' }));
    await expect(await canvas.findByText('Server is locked by policy')).toBeInTheDocument();
    await expect(args.onSelect).not.toHaveBeenCalled();
  },
};

export const RemoveFlow = {
  args: {
    onSelect: fn(),
    onAuthenticate: fn(),
    onEnable: fn(),
    onDisable: fn(),
    onReconnect: fn(),
    onRemove: failFirstCall('Project servers live in .mcp.json'),
  },
  render: (args: ListFlowArgs) => <FlowList {...args} />,
  play: async ({ canvasElement, args }: { canvasElement: HTMLElement; args: ListFlowArgs }) => {
    prepareFlow();
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);

    await userEvent.click(await canvas.findByRole('button', { name: 'Server actions: git' }));
    await userEvent.click(await page.findByRole('menuitem', { name: 'Remove' }));
    const dialog = within(await page.findByRole('dialog', { name: 'Remove server' }));
    await expect(
      dialog.getByText(/git and its tools will no longer be available/)
    ).toBeInTheDocument();
    await expect(args.onRemove).not.toHaveBeenCalled();

    await userEvent.click(dialog.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(page.queryByRole('dialog')).not.toBeInTheDocument());
    await expect(args.onRemove).not.toHaveBeenCalled();

    await userEvent.click(canvas.getByRole('button', { name: 'Server actions: git' }));
    await userEvent.click(await page.findByRole('menuitem', { name: 'Remove' }));
    const retry = within(await page.findByRole('dialog', { name: 'Remove server' }));
    await userEvent.click(retry.getByRole('button', { name: 'Remove' }));
    await expect(await retry.findByText('Project servers live in .mcp.json')).toBeInTheDocument();

    await userEvent.click(retry.getByRole('button', { name: 'Remove' }));
    await waitFor(() => expect(page.queryByRole('dialog')).not.toBeInTheDocument());
    await expect(args.onRemove).toHaveBeenCalledTimes(2);
    await expect(args.onRemove).toHaveBeenLastCalledWith(expect.objectContaining({ id: 'git' }));
    await waitFor(() => expect(canvas.queryByText('git')).not.toBeInTheDocument());
  },
};
