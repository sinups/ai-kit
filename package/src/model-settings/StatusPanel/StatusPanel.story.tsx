import React from 'react';
import { expect, fn, userEvent, waitFor, within } from '@storybook/test';
import { Stack } from '@mantine/core';
import { IconLogout, IconStethoscope } from '@tabler/icons-react';
import { NARROW_WIDTH, WIDE_WIDTH, WidthFrame } from '../../_stories/WidthFrame';
import { MCP_SERVERS } from '../fixtures';
import { StatusPanel } from './StatusPanel';

export default { title: 'Settings/StatusPanel' };

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function Demo() {
  return (
    <StatusPanel
      version="2.1.4"
      model="Qwen 2.5 Coder 32B"
      account={{ email: 'dev@example.com', plan: 'Max' }}
      organization="Acme"
      cwd="/Users/dev/projects/acme-web/packages/auth"
      mcpServers={MCP_SERVERS}
      memoryFiles={[
        { path: '~/.agent/AGENTS.md', tokens: 820 },
        { path: 'AGENTS.md', tokens: 2_400 },
      ]}
      context={{
        used: 142_000,
        total: 200_000,
        segments: [
          { label: 'System', value: 18_000 },
          { label: 'Tools', value: 24_000 },
          { label: 'Messages', value: 100_000 },
        ],
      }}
      actions={[
        { label: 'Run doctor', icon: <IconStethoscope size={14} />, onClick: () => wait(1200) },
        { label: 'Log out', icon: <IconLogout size={14} />, onClick: () => wait(600) },
      ]}
    />
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

export function Minimal() {
  return (
    <Stack p="xl" maw={640}>
      <StatusPanel version="2.1.4" mcpServers={[]} memoryFiles={[]} />
    </Stack>
  );
}

interface ActionsFlowArgs {
  onDoctor: () => void;
  onLogout: () => void;
}

function ActionsDemo({ onDoctor, onLogout }: ActionsFlowArgs) {
  return (
    <Stack p="xl" maw={640}>
      <StatusPanel
        version="2.1.4"
        model="Qwen 2.5 Coder 32B"
        account={{ email: 'dev@example.com', plan: 'Max' }}
        mcpServers={MCP_SERVERS}
        context={{ used: 142_000, total: 200_000 }}
        actions={[
          {
            label: 'Run doctor',
            icon: <IconStethoscope size={14} />,
            onClick: async () => {
              onDoctor();
              throw new globalThis.Error('Doctor could not reach the API');
            },
          },
          { label: 'Log out', icon: <IconLogout size={14} />, onClick: () => onLogout() },
        ]}
      />
    </Stack>
  );
}

export function ActionsFlow(args: ActionsFlowArgs) {
  return <ActionsDemo onDoctor={() => args.onDoctor()} onLogout={() => args.onLogout()} />;
}

ActionsFlow.args = { onDoctor: fn(), onLogout: fn() };

ActionsFlow.play = async ({
  canvasElement,
  args,
}: {
  canvasElement: HTMLElement;
  args: ActionsFlowArgs;
}) => {
  const canvas = within(canvasElement);
  await expect(canvas.getByText('2 connected')).toBeInTheDocument();
  await expect(canvas.getByText('1 failed')).toBeInTheDocument();
  await expect(canvas.getByText('142k / 200k tokens')).toBeInTheDocument();

  await userEvent.click(canvas.getByRole('button', { name: 'Run doctor' }));
  await expect(args.onDoctor).toHaveBeenCalledTimes(1);
  await expect(await canvas.findByText('Doctor could not reach the API')).toBeInTheDocument();

  await userEvent.click(canvas.getByRole('button', { name: 'Log out' }));
  await expect(args.onLogout).toHaveBeenCalledTimes(1);
  await waitFor(() =>
    expect(canvas.queryByText('Doctor could not reach the API')).not.toBeInTheDocument()
  );
};
