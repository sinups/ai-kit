import React, { useMemo, useState } from 'react';
import { expect, fn, userEvent, within } from '@storybook/test';
import { Button, Code, Stack } from '@mantine/core';
import { NARROW_WIDTH, WIDE_WIDTH, WidthFrame } from '../../_stories/WidthFrame';
import { CommandPalette } from '../../primitives/CommandPalette/CommandPalette';
import { toPaletteCommands } from '../commands-help';
import { HELP_COMMANDS, HELP_SHORTCUTS } from '../fixtures';
import type { CommandHelpItem } from '../types';
import { CommandsHelp } from './CommandsHelp';

export default { title: 'Settings/CommandsHelp' };

function Demo() {
  return <CommandsHelp commands={HELP_COMMANDS} shortcuts={HELP_SHORTCUTS} />;
}

export function Usage() {
  return (
    <Stack p="xl" maw={560}>
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

export function Selectable() {
  const [picked, setPicked] = useState('');
  return (
    <Stack p="xl" maw={560}>
      {picked && <Code>{picked}</Code>}
      <CommandsHelp
        commands={HELP_COMMANDS}
        onCommandSelect={(command) => setPicked(`/${command.name} `)}
      />
    </Stack>
  );
}

export function InCommandPalette() {
  const [opened, setOpened] = useState(false);
  const [picked, setPicked] = useState('');
  const commands = useMemo(
    () => toPaletteCommands(HELP_COMMANDS, (command) => setPicked(`/${command.name}`)),
    []
  );
  return (
    <Stack p="xl" maw={560} align="flex-start">
      <Button onClick={() => setOpened(true)}>Open palette</Button>
      {picked && <Code>{picked}</Code>}
      <CommandPalette opened={opened} onClose={() => setOpened(false)} commands={commands} />
    </Stack>
  );
}

interface SearchFlowArgs {
  onCommandSelect: (command: CommandHelpItem) => void;
}

export function SearchFlow(args: SearchFlowArgs) {
  return (
    <Stack p="xl" maw={560}>
      <CommandsHelp
        commands={HELP_COMMANDS}
        shortcuts={HELP_SHORTCUTS}
        onCommandSelect={args.onCommandSelect}
      />
    </Stack>
  );
}

SearchFlow.args = { onCommandSelect: fn() };

SearchFlow.play = async ({
  canvasElement,
  args,
}: {
  canvasElement: HTMLElement;
  args: SearchFlowArgs;
}) => {
  const canvas = within(canvasElement);
  const search = canvas.getByRole('textbox');

  await userEvent.type(search, 'compact');
  await expect(await canvas.findByText('/compact [instructions]')).toBeInTheDocument();
  await expect(canvas.queryByText('/review <path> [--staged]')).not.toBeInTheDocument();
  await expect(canvas.getByRole('tab', { name: /Commands \(1\)/ })).toBeInTheDocument();
  await expect(canvas.getByRole('tab', { name: /Shortcuts \(0\)/ })).toBeInTheDocument();

  await userEvent.click(canvas.getByRole('button', { name: /\/compact/ }));
  await expect(args.onCommandSelect).toHaveBeenCalledWith(
    expect.objectContaining({ name: 'compact' })
  );

  await userEvent.clear(search);
  await userEvent.click(canvas.getByRole('tab', { name: /Shortcuts/ }));
  await expect(await canvas.findByText('Open the command palette')).toBeInTheDocument();
  await expect(canvas.getByRole('group', { name: 'Composer' })).toBeInTheDocument();

  await userEvent.type(search, 'rewind');
  await expect(await canvas.findByText('Rewind to the previous message')).toBeInTheDocument();
  await expect(canvas.queryByText('Open the command palette')).not.toBeInTheDocument();
};
