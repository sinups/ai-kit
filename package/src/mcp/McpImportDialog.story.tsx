import React, { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from '@storybook/test';
import { failFirstCall, prepareFlow } from '../_stories/flow-helpers';
import { Button, Code, Stack } from '@mantine/core';
import { IMPORT_CANDIDATES } from './discovery-fixtures';
import { MCP_SERVERS } from './fixtures';
import { McpImportDialog } from './McpImportDialog';
import type { McpServerCandidate } from './types';

export default { title: 'MCP/McpImportDialog' };

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const EXISTING = MCP_SERVERS.map((server) => server.name);

function Demo({
  servers = IMPORT_CANDIDATES,
  fail = false,
}: {
  servers?: McpServerCandidate[];
  fail?: boolean;
}) {
  const [opened, setOpened] = useState(true);
  const [result, setResult] = useState<McpServerCandidate[] | null>(null);
  return (
    <Stack p="xl" align="flex-start">
      <Button onClick={() => setOpened(true)}>Import from Desktop client</Button>
      {result && <Code block>{JSON.stringify(result.map((server) => server.name))}</Code>}
      <McpImportDialog
        opened={opened}
        onClose={() => setOpened(false)}
        sourceLabel="Desktop client"
        servers={servers}
        existingNames={EXISTING}
        onImport={async (picked) => {
          await wait(700);
          if (fail) {
            throw new Error('Could not write ~/.agent/config.json');
          }
          setResult(picked);
        }}
      />
    </Stack>
  );
}

export function Usage() {
  return <Demo />;
}

export function RejectedAction() {
  return <Demo fail />;
}

export function Empty() {
  return <Demo servers={[]} />;
}

interface ImportFlowArgs {
  onImport: (servers: McpServerCandidate[]) => void | Promise<void>;
  onClose: () => void;
}

function FlowImport({ onImport, onClose }: ImportFlowArgs) {
  const [opened, setOpened] = useState(true);
  const [result, setResult] = useState<McpServerCandidate[] | null>(null);
  return (
    <Stack p="xl" align="flex-start">
      <Button onClick={() => setOpened(true)}>Import from Desktop client</Button>
      {result && <Code block>{result.map((server) => server.name).join(', ')}</Code>}
      <McpImportDialog
        opened={opened}
        onClose={() => {
          onClose();
          setOpened(false);
        }}
        sourceLabel="Desktop client"
        servers={IMPORT_CANDIDATES}
        existingNames={EXISTING}
        onImport={async (picked) => {
          await onImport(picked);
          setResult(picked);
        }}
      />
    </Stack>
  );
}

export const CollisionsFlow = {
  args: {
    onImport: failFirstCall('Could not write ~/.agent/config.json'),
    onClose: fn(),
  },
  render: (args: ImportFlowArgs) => <FlowImport {...args} />,
  play: async ({ canvasElement, args }: { canvasElement: HTMLElement; args: ImportFlowArgs }) => {
    prepareFlow();
    const page = within(canvasElement.ownerDocument.body);
    const dialog = within(
      await page.findByRole('dialog', { name: 'Import MCP servers from Desktop client' })
    );

    await expect(dialog.getByRole('textbox', { name: 'Server name: git' })).toHaveValue('git_1');
    await expect(dialog.getByRole('textbox', { name: 'Server name: filesystem' })).toHaveValue(
      'filesystem_1'
    );
    await expect(dialog.getAllByText('Renamed')).toHaveLength(2);

    const notion = dialog.getByRole('textbox', { name: 'Server name: notion' });
    await userEvent.clear(notion);
    await userEvent.type(notion, 'issues');
    await expect(
      await dialog.findByText('A server with this name already exists')
    ).toBeInTheDocument();
    await expect(dialog.getByRole('button', { name: 'Import 4' })).toBeDisabled();

    await userEvent.clear(notion);
    await userEvent.type(notion, 'git_1');
    await expect(
      await dialog.findByText('Another imported server uses this name')
    ).toBeInTheDocument();

    await userEvent.clear(notion);
    await userEvent.type(notion, 'notion');
    await userEvent.click(dialog.getByRole('checkbox', { name: 'memory' }));
    await userEvent.click(await dialog.findByRole('button', { name: 'Import 3' }));
    await expect(
      await dialog.findByText('Could not write ~/.agent/config.json')
    ).toBeInTheDocument();
    await expect(args.onClose).not.toHaveBeenCalled();

    await userEvent.click(dialog.getByRole('button', { name: 'Import 3' }));
    await waitFor(() => expect(args.onImport).toHaveBeenCalledTimes(2));
    await expect(args.onImport).toHaveBeenLastCalledWith([
      { ...IMPORT_CANDIDATES[0], name: 'git_1' },
      { ...IMPORT_CANDIDATES[1], name: 'filesystem_1' },
      IMPORT_CANDIDATES[2],
    ]);
    await waitFor(() => expect(args.onClose).toHaveBeenCalled(), { timeout: 5000 });
    await expect(
      await within(canvasElement).findByText('git_1, filesystem_1, notion')
    ).toBeInTheDocument();
  },
};
