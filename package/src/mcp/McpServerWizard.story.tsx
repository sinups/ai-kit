import React, { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from '@storybook/test';
import { failFirstCall, prepareFlow } from '../_stories/flow-helpers';
import { Button, Code, Stack } from '@mantine/core';
import { NARROW_WIDTH, WIDE_WIDTH, WidthFrame } from '../_stories/WidthFrame';
import { GIT_SERVER, MCP_SERVERS } from './fixtures';
import { McpServerWizard, McpServerWizardModal } from './McpServerWizard';
import type { McpServer, McpServerDraft, McpTransport } from './types';

export default { title: 'mcp/McpServerWizard' };

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const NAMES = MCP_SERVERS.map((server) => server.name);

function Demo({
  width,
  initialServer,
  initialTransport,
}: {
  width: number;
  initialServer?: McpServer;
  initialTransport?: McpTransport;
}) {
  const [result, setResult] = useState<McpServerDraft | null>(null);
  return (
    <WidthFrame width={width}>
      <Stack gap="lg">
        <McpServerWizard
          initialServer={initialServer}
          defaultTransport={initialTransport}
          existingNames={NAMES}
          onSubmit={async (draft) => {
            await wait(700);
            setResult(draft);
          }}
          onCancel={() => setResult(null)}
        />
        {result && <Code block>{JSON.stringify(result, null, 2)}</Code>}
      </Stack>
    </WidthFrame>
  );
}

export function Stdio() {
  return <Demo width={WIDE_WIDTH} />;
}

export function Http() {
  return <Demo width={WIDE_WIDTH} initialTransport="http" />;
}

export function Narrow() {
  return <Demo width={NARROW_WIDTH} />;
}

export function Edit() {
  return <Demo width={WIDE_WIDTH} initialServer={GIT_SERVER} />;
}

export function Modal() {
  const [opened, setOpened] = useState(true);
  return (
    <Stack p="xl" align="flex-start">
      <Button onClick={() => setOpened(true)}>Add server</Button>
      <McpServerWizardModal
        opened={opened}
        onClose={() => setOpened(false)}
        existingNames={NAMES}
        onSubmit={() =>
          wait(800).then(() =>
            Promise.reject(new Error('npx exited with code 1: package not found'))
          )
        }
      />
    </Stack>
  );
}

interface WizardFlowArgs {
  onSubmit: (draft: McpServerDraft) => void | Promise<void>;
  onCancel: () => void;
}

function FlowWizard({
  width,
  initialServer,
  onSubmit,
  onCancel,
}: WizardFlowArgs & { width: number; initialServer?: McpServer }) {
  const [result, setResult] = useState<McpServerDraft | null>(null);
  return (
    <WidthFrame width={width}>
      <Stack gap="lg">
        <McpServerWizard
          initialServer={initialServer}
          existingNames={NAMES}
          onSubmit={async (draft) => {
            await onSubmit(draft);
            setResult(draft);
          }}
          onCancel={onCancel}
        />
        {result && <Code block>{JSON.stringify(result, null, 2)}</Code>}
      </Stack>
    </WidthFrame>
  );
}

type Canvas = ReturnType<typeof within>;

const clickNext = (canvas: Canvas) => userEvent.click(canvas.getByRole('button', { name: 'Next' }));

const findField = (canvas: Canvas, name: RegExp | string) =>
  canvas.findByRole('textbox', { name }, { timeout: 5000 });

export const StdioFlow = {
  args: { onSubmit: fn(() => wait(200)), onCancel: fn() },
  render: (args: WizardFlowArgs) => <FlowWizard width={WIDE_WIDTH} {...args} />,
  play: async ({ canvasElement, args }: { canvasElement: HTMLElement; args: WizardFlowArgs }) => {
    prepareFlow();
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);

    await findField(canvas, /Name/);
    await clickNext(canvas);
    await expect(await canvas.findByText('Enter a server name')).toBeInTheDocument();
    await userEvent.type(canvas.getByRole('textbox', { name: /Name/ }), 'git');
    await clickNext(canvas);
    await expect(
      await canvas.findByText('A server with this name already exists')
    ).toBeInTheDocument();
    await userEvent.clear(canvas.getByRole('textbox', { name: /Name/ }));
    await userEvent.type(canvas.getByRole('textbox', { name: /Name/ }), 'memory');
    await userEvent.click(canvas.getByRole('combobox', { name: /Scope/ }));
    await userEvent.click(await page.findByRole('option', { name: 'Project' }));
    await clickNext(canvas);

    const command = await findField(canvas, /Command/);
    await clickNext(canvas);
    await expect(
      await canvas.findByText('Enter the command that starts the server')
    ).toBeInTheDocument();
    await userEvent.click(command);
    await userEvent.paste('npx -y @modelcontextprotocol/server-memory');
    await expect(command).toHaveValue('npx');
    await clickNext(canvas);

    await userEvent.click(await canvas.findByRole('button', { name: 'Add variable' }));
    await userEvent.type(await findField(canvas, 'NAME 1'), 'MEMORY_FILE');
    await userEvent.type(canvas.getByRole('textbox', { name: 'value 1' }), '/tmp/memory.json');
    await clickNext(canvas);

    await expect(
      await canvas.findByText('npx -y @modelcontextprotocol/server-memory', {}, { timeout: 5000 })
    ).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: 'Add server' }));
    await waitFor(() =>
      expect(args.onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'memory',
          scope: 'project',
          transport: 'stdio',
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-memory'],
          env: [expect.objectContaining({ key: 'MEMORY_FILE', value: '/tmp/memory.json' })],
        })
      )
    );
    await expect(
      await canvas.findByText(/"name": "memory"/, {}, { timeout: 5000 })
    ).toBeInTheDocument();
  },
};

export const HttpFlow = {
  args: { onSubmit: fn(() => wait(200)), onCancel: fn() },
  render: (args: WizardFlowArgs) => <FlowWizard width={WIDE_WIDTH} {...args} />,
  play: async ({ canvasElement, args }: { canvasElement: HTMLElement; args: WizardFlowArgs }) => {
    prepareFlow();
    const canvas = within(canvasElement);

    await userEvent.type(await findField(canvas, /Name/), 'notion');
    await userEvent.click(canvas.getByRole('radio', { name: 'HTTP' }));
    await clickNext(canvas);

    const url = await findField(canvas, /URL/);
    await userEvent.type(url, 'mcp.notion.com');
    await clickNext(canvas);
    await expect(await canvas.findByText('Enter an http:// or https:// URL')).toBeInTheDocument();
    await userEvent.clear(url);
    await userEvent.type(url, 'https://mcp.notion.com/mcp');
    await clickNext(canvas);

    await userEvent.click(await canvas.findByRole('button', { name: 'Add header' }));
    const header = await findField(canvas, 'Header 1');
    await userEvent.type(header, 'Bad Header');
    await clickNext(canvas);
    await waitFor(() => expect(header).toHaveAttribute('aria-invalid', 'true'));
    await userEvent.clear(header);
    await userEvent.type(header, 'X-Workspace');
    await userEvent.type(canvas.getByRole('textbox', { name: 'value 1' }), 'acme');
    await clickNext(canvas);

    await userEvent.click(
      await canvas.findByRole('button', { name: 'Add server' }, { timeout: 5000 })
    );
    await waitFor(() =>
      expect(args.onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'notion',
          transport: 'http',
          url: 'https://mcp.notion.com/mcp',
          headers: [expect.objectContaining({ key: 'X-Workspace', value: 'acme' })],
        })
      )
    );
    await expect(
      await canvas.findByText(/"url": "https:\/\/mcp.notion.com\/mcp"/, {}, { timeout: 5000 })
    ).toBeInTheDocument();
  },
};

export const EditFlow = {
  args: {
    onSubmit: failFirstCall('Server rejected the handshake'),
    onCancel: fn(),
  },
  render: (args: WizardFlowArgs) => (
    <FlowWizard width={NARROW_WIDTH} initialServer={GIT_SERVER} {...args} />
  ),
  play: async ({ canvasElement, args }: { canvasElement: HTMLElement; args: WizardFlowArgs }) => {
    prepareFlow();
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);

    await expect(await findField(canvas, /Name/)).toHaveValue('git');
    await clickNext(canvas);
    const url = await findField(canvas, /URL/);
    await expect(url).toHaveValue(GIT_SERVER.url);
    await userEvent.clear(url);

    await userEvent.click(canvas.getByRole('button', { name: 'Go to step' }));
    await userEvent.click(await page.findByRole('menuitem', { name: '4. Review' }));
    await expect(await canvas.findByText('••••••••')).toBeInTheDocument();

    await userEvent.click(canvas.getByRole('button', { name: 'Save' }));
    await expect(await canvas.findByText('Enter the server URL')).toBeInTheDocument();
    await expect(args.onSubmit).not.toHaveBeenCalled();

    await userEvent.type(canvas.getByRole('textbox', { name: /URL/ }), GIT_SERVER.url!);
    await userEvent.click(canvas.getByRole('button', { name: 'Save' }));
    await expect(
      await canvas.findByText('Server rejected the handshake', {}, { timeout: 5000 })
    ).toBeInTheDocument();

    await userEvent.click(canvas.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(args.onSubmit).toHaveBeenCalledTimes(2));
    await expect(args.onSubmit).toHaveBeenLastCalledWith(
      expect.objectContaining({ id: 'git', transport: 'http', headers: GIT_SERVER.headers })
    );
    await expect(await canvas.findByText(/"id": "git"/, {}, { timeout: 5000 })).toBeInTheDocument();
  },
};
