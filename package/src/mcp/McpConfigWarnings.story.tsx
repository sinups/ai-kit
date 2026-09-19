import React, { useState } from 'react';
import { expect, fn, userEvent, within } from '@storybook/test';
import { prepareFlow } from '../_stories/flow-helpers';
import { Stack, Text } from '@mantine/core';
import { NARROW_WIDTH, WIDE_WIDTH, WidthFrame } from '../_stories/WidthFrame';
import { CONFIG_WARNINGS } from './discovery-fixtures';
import { McpConfigWarnings } from './McpConfigWarnings';

export default { title: 'MCP/McpConfigWarnings' };

function Demo() {
  const [opened, setOpened] = useState('');
  return (
    <Stack gap="xs">
      <McpConfigWarnings warnings={CONFIG_WARNINGS} onOpenFile={setOpened} />
      {opened && (
        <Text size="xs" c="dimmed">
          Open {opened}
        </Text>
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

interface WarningsFlowArgs {
  onOpenFile: (file: string) => void;
}

function FlowWarnings({ onOpenFile }: WarningsFlowArgs) {
  const [opened, setOpened] = useState('');
  return (
    <WidthFrame width={WIDE_WIDTH}>
      <Stack gap="xs">
        <McpConfigWarnings
          warnings={CONFIG_WARNINGS}
          onOpenFile={(file) => {
            onOpenFile(file);
            setOpened(file);
          }}
        />
        {opened && (
          <Text size="xs" c="dimmed">
            Open {opened}
          </Text>
        )}
      </Stack>
    </WidthFrame>
  );
}

export const OpenFileFlow = {
  args: { onOpenFile: fn() },
  render: (args: WarningsFlowArgs) => <FlowWarnings {...args} />,
  play: async ({ canvasElement, args }: { canvasElement: HTMLElement; args: WarningsFlowArgs }) => {
    prepareFlow();
    const canvas = within(canvasElement);
    const project = within(await canvas.findByRole('region', { name: '.mcp.json' }));
    await expect(project.getByText('Duplicate name')).toBeInTheDocument();
    const user = within(canvas.getByRole('region', { name: '~/.agent/config.json' }));
    await expect(user.getByText('Invalid value')).toBeInTheDocument();

    await userEvent.click(user.getByRole('button', { name: 'Open file' }));
    await expect(args.onOpenFile).toHaveBeenCalledWith('~/.agent/config.json');
    await expect(await canvas.findByText('Open ~/.agent/config.json')).toBeInTheDocument();

    await userEvent.click(project.getByRole('button', { name: 'Open file' }));
    await expect(args.onOpenFile).toHaveBeenLastCalledWith('.mcp.json');
    await expect(await canvas.findByText('Open .mcp.json')).toBeInTheDocument();
  },
};
