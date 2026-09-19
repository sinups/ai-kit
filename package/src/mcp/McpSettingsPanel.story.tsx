import React, { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from '@storybook/test';
import { prepareFlow } from '../_stories/flow-helpers';
import { Box } from '@mantine/core';
import { NARROW_WIDTH, WIDE_WIDTH, WidthFrame } from '../_stories/WidthFrame';
import { MCP_SERVERS } from './fixtures';
import { McpSettingsPanel } from './McpSettingsPanel';
import type { McpServer, McpServerDraft, McpServerStatus } from './types';

export default { title: 'MCP/McpSettingsPanel', parameters: { layout: 'fullscreen' } };

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function fromDraft(draft: McpServerDraft, previous?: McpServer): McpServer {
  return {
    ...previous,
    id: draft.id ?? draft.name,
    name: draft.name,
    scope: draft.scope,
    transport: draft.transport,
    status: previous?.status ?? 'connecting',
    command: draft.command || undefined,
    args: draft.args,
    url: draft.url || undefined,
    env: draft.env,
    headers: draft.headers,
  };
}

function Demo() {
  const [servers, setServers] = useState(MCP_SERVERS);

  const setStatus = (id: string, status: McpServerStatus, patch: Partial<McpServer> = {}) =>
    setServers((prev) =>
      prev.map((server) => (server.id === id ? { ...server, status, ...patch } : server))
    );

  return (
    <McpSettingsPanel
      servers={servers}
      onAdd={async (draft) => {
        await wait(700);
        setServers((prev) => [...prev, fromDraft(draft)]);
      }}
      onUpdate={async (draft) => {
        await wait(700);
        setServers((prev) =>
          prev.map((server) => (server.id === draft.id ? fromDraft(draft, server) : server))
        );
      }}
      onReconnect={async (server) => {
        setStatus(server.id, 'connecting');
        await wait(1200);
        setStatus(server.id, server.id === 'errors' ? 'error' : 'connected');
        if (server.id === 'errors') {
          throw new Error('Still unreachable: 502 Bad Gateway');
        }
      }}
      onAuthenticate={async (server) => {
        await wait(1000);
        setStatus(server.id, 'connected', { toolCount: 23 });
      }}
      onEnable={async (server) => {
        await wait(500);
        setStatus(server.id, 'connected');
      }}
      onDisable={async (server) => {
        await wait(500);
        setStatus(server.id, 'disabled');
      }}
      onRemove={async (server) => {
        await wait(500);
        setServers((prev) => prev.filter((item) => item.id !== server.id));
      }}
      onTryTool={() => {}}
    />
  );
}

export function Usage() {
  return (
    <Box h="100vh">
      <Demo />
    </Box>
  );
}

export function Narrow() {
  return (
    <WidthFrame width={NARROW_WIDTH}>
      <Box h={640}>
        <Demo />
      </Box>
    </WidthFrame>
  );
}

export function Wide() {
  return (
    <WidthFrame width={WIDE_WIDTH}>
      <Box h={640}>
        <Demo />
      </Box>
    </WidthFrame>
  );
}

interface PanelFlowArgs {
  onSelectedIdChange: (id: string | null) => void;
  onTryTool: (server: McpServer, tool: { name: string }) => void;
  onAdd: (draft: McpServerDraft) => Promise<void>;
}

function FlowPanel({ onSelectedIdChange, onTryTool, onAdd }: PanelFlowArgs) {
  const [servers, setServers] = useState(MCP_SERVERS);
  return (
    <McpSettingsPanel
      servers={servers}
      onSelectedIdChange={onSelectedIdChange}
      onTryTool={onTryTool}
      onAdd={async (draft) => {
        await onAdd(draft);
        setServers((prev) => [...prev, fromDraft(draft)]);
      }}
    />
  );
}

export const DrillDownFlow = {
  args: {
    onSelectedIdChange: fn(),
    onTryTool: fn(),
    onAdd: fn(async () => {}),
  },
  render: (args: PanelFlowArgs) => (
    <WidthFrame width={NARROW_WIDTH}>
      <Box h={640}>
        <FlowPanel {...args} />
      </Box>
    </WidthFrame>
  ),
  play: async ({ canvasElement, args }: { canvasElement: HTMLElement; args: PanelFlowArgs }) => {
    prepareFlow();
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByText('git'));
    await expect(await canvas.findByRole('heading', { name: 'git' })).toBeInTheDocument();
    await expect(args.onSelectedIdChange).toHaveBeenLastCalledWith('git');
    await expect(canvas.queryByRole('textbox', { name: 'Search servers' })).not.toBeInTheDocument();

    await userEvent.click(canvas.getByText('Create issue'));
    await expect(await canvas.findByRole('heading', { name: 'Create issue' })).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: 'Try tool' }));
    await expect(args.onTryTool).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'git' }),
      expect.objectContaining({ name: 'create_issue' })
    );

    await userEvent.click(canvas.getByRole('button', { name: 'Back: git' }));
    await expect(await canvas.findByRole('tab', { name: /Tools/ })).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: 'Servers' }));
    await expect(
      await canvas.findByRole('textbox', { name: 'Search servers' })
    ).toBeInTheDocument();
    await expect(args.onSelectedIdChange).toHaveBeenLastCalledWith(null);
  },
};

export const AddServerFlow = {
  args: {
    onSelectedIdChange: fn(),
    onTryTool: fn(),
    onAdd: fn(async () => {
      await wait(300);
    }),
  },
  render: (args: PanelFlowArgs) => (
    <WidthFrame width={WIDE_WIDTH}>
      <Box h={640}>
        <FlowPanel {...args} />
      </Box>
    </WidthFrame>
  ),
  play: async ({ canvasElement, args }: { canvasElement: HTMLElement; args: PanelFlowArgs }) => {
    prepareFlow();
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(await canvas.findByRole('button', { name: 'Add server' }));
    const dialog = within(await page.findByRole('dialog', { name: 'Add MCP server' }));

    await userEvent.type(dialog.getByRole('textbox', { name: /Name/ }), 'memory');
    await userEvent.click(dialog.getByRole('button', { name: 'Next' }));
    await userEvent.type(
      await dialog.findByRole('textbox', { name: /Command/ }, { timeout: 5000 }),
      'npx'
    );
    await userEvent.click(dialog.getByRole('button', { name: 'Next' }));
    await userEvent.click(await dialog.findByRole('button', { name: 'Next' }));
    await userEvent.click(await dialog.findByRole('button', { name: 'Add server' }));

    await waitFor(() =>
      expect(args.onAdd).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'memory', transport: 'stdio', command: 'npx' })
      )
    );
    await waitFor(() => expect(page.queryByRole('dialog')).not.toBeInTheDocument());
    await expect(await canvas.findByText('memory')).toBeInTheDocument();
  },
};
