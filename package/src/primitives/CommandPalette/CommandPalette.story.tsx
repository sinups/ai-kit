import React, { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from '@storybook/test';
import { Button, Code, Group, Stack, Text } from '@mantine/core';
import {
  IconHistory,
  IconMessagePlus,
  IconMoon,
  IconPlug,
  IconRobot,
  IconSettings,
  IconTrash,
} from '@tabler/icons-react';
import { NARROW_WIDTH, WIDE_WIDTH, WidthFrame } from '../../_stories/WidthFrame';
import { ShortcutHint } from '../ShortcutHint/ShortcutHint';
import type { PaletteCommand } from './command-palette';
import { CommandPalette, type CommandPaletteProps } from './CommandPalette';

export default { title: 'Primitives/CommandPalette' };

const COMMANDS: PaletteCommand[] = [
  {
    id: 'new-chat',
    label: 'New chat',
    description: 'Start a conversation with the current agent',
    group: 'Chat',
    icon: <IconMessagePlus size={16} />,
    shortcut: 'mod+N',
  },
  {
    id: 'clear',
    label: 'Clear conversation',
    group: 'Chat',
    icon: <IconTrash size={16} />,
    keywords: ['reset', 'wipe'],
  },
  {
    id: 'history',
    label: 'Open session history',
    group: 'Chat',
    icon: <IconHistory size={16} />,
    shortcut: 'mod+shift+H',
  },
  {
    id: 'switch-agent',
    label: 'Switch agent',
    description: 'Choose another agent profile',
    group: 'Agents',
    icon: <IconRobot size={16} />,
  },
  {
    id: 'mcp',
    label: 'Manage MCP servers',
    group: 'Settings',
    icon: <IconPlug size={16} />,
    keywords: ['tools', 'connectors'],
  },
  {
    id: 'theme',
    label: 'Toggle dark theme',
    group: 'Settings',
    icon: <IconMoon size={16} />,
    shortcut: 'mod+J',
  },
  {
    id: 'settings',
    label: 'Open settings',
    group: 'Settings',
    icon: <IconSettings size={16} />,
    shortcut: 'mod+,',
  },
  {
    id: 'export',
    label: 'Export transcript',
    description: 'Available after the first message',
    group: 'Chat',
    disabled: true,
  },
];

function Demo({
  width,
  initiallyOpened = true,
  ...props
}: Partial<CommandPaletteProps> & { width: number; initiallyOpened?: boolean }) {
  const [opened, setOpened] = useState(initiallyOpened);
  const [recentIds, setRecentIds] = useState<string[]>(['theme', 'new-chat']);
  const [last, setLast] = useState<string | null>(null);

  return (
    <WidthFrame width={width}>
      <Stack gap="xs" align="flex-start">
        <Button variant="default" onClick={() => setOpened(true)}>
          Open palette
        </Button>
        {last && (
          <Text size="sm">
            Ran <Code>{last}</Code>
          </Text>
        )}
      </Stack>
      <CommandPalette
        opened={opened}
        onClose={() => setOpened(false)}
        commands={COMMANDS}
        recentIds={recentIds}
        onSelect={(command) => {
          setLast(command.id);
          setRecentIds((ids) => [command.id, ...ids.filter((id) => id !== command.id)].slice(0, 3));
        }}
        {...props}
      />
    </WidthFrame>
  );
}

export function Usage() {
  return <Demo width={WIDE_WIDTH} />;
}

export function Narrow() {
  return <Demo width={NARROW_WIDTH} />;
}

export function Wide() {
  return <Demo width={WIDE_WIDTH} maxHeight={520} />;
}

export function Grouped() {
  return <Demo width={WIDE_WIDTH} recentIds={[]} />;
}

export function WithHotkey() {
  const [opened, setOpened] = useState(false);
  return (
    <WidthFrame width={WIDE_WIDTH}>
      <Group gap={4}>
        <Text size="sm">Press</Text>
        <ShortcutHint keys="mod+K" />
        <Text size="sm">to open the palette</Text>
      </Group>
      <CommandPalette
        opened={opened}
        onOpen={() => setOpened(true)}
        onClose={() => setOpened(false)}
        hotkey="mod+K"
        commands={COMMANDS}
      />
    </WidthFrame>
  );
}

type FlowArgs = {
  onOpen: () => void;
  onClose: () => void;
  onSelect: (command: PaletteCommand) => void;
  onRun: (id: string) => void;
};

type FlowContext = { canvasElement: HTMLElement; args: FlowArgs };

const flowArgs = (): FlowArgs => ({ onOpen: fn(), onClose: fn(), onSelect: fn(), onRun: fn() });

function FlowPalette({
  args,
  initiallyOpened = true,
  recentIds = [],
}: {
  args: FlowArgs;
  initiallyOpened?: boolean;
  recentIds?: string[];
}) {
  const [opened, setOpened] = useState(initiallyOpened);
  const [last, setLast] = useState<string | null>(null);
  const commands = COMMANDS.map((command) => ({
    ...command,
    onSelect: () => args.onRun(command.id),
  }));
  return (
    <WidthFrame width={WIDE_WIDTH}>
      <Text size="sm">{opened ? 'Palette open' : 'Palette closed'}</Text>
      {last && <Text size="sm">Ran {last}</Text>}
      <CommandPalette
        opened={opened}
        hotkey="mod+K"
        onOpen={() => {
          args.onOpen();
          setOpened(true);
        }}
        onClose={() => {
          args.onClose();
          setOpened(false);
        }}
        onSelect={(command) => {
          args.onSelect(command);
          setLast(command.id);
        }}
        commands={commands}
        recentIds={recentIds}
      />
    </WidthFrame>
  );
}

const pageOf = (canvasElement: HTMLElement) => within(canvasElement.ownerDocument.body);

const pressModK = async () => {
  const isMac = /mac|iphone|ipad/i.test(navigator.platform);
  await userEvent.keyboard(isMac ? '{Meta>}k{/Meta}' : '{Control>}k{/Control}');
};

export const HotkeyFlow = {
  args: flowArgs(),
  render: (args: FlowArgs) => <FlowPalette args={args} initiallyOpened={false} />,
  play: async ({ canvasElement, args }: FlowContext) => {
    const canvas = within(canvasElement);
    const page = pageOf(canvasElement);
    await expect(canvas.getByText('Palette closed')).toBeInTheDocument();
    await pressModK();
    await expect(args.onOpen).toHaveBeenCalledTimes(1);
    const input = await page.findByRole('combobox', { name: 'Search commands' });
    await expect(canvas.getByText('Palette open')).toBeInTheDocument();
    await userEvent.type(input, '{Escape}');
    await expect(args.onClose).toHaveBeenCalled();
    await waitFor(() => expect(canvas.getByText('Palette closed')).toBeInTheDocument());
    await waitFor(() => expect(page.queryByRole('combobox')).not.toBeInTheDocument());
  },
};

export const FuzzyFlow = {
  args: flowArgs(),
  render: (args: FlowArgs) => <FlowPalette args={args} />,
  play: async ({ canvasElement }: FlowContext) => {
    const page = pageOf(canvasElement);
    const input = await page.findByRole('combobox', { name: 'Search commands' });
    await userEvent.type(input, 'tgth');
    await waitFor(() => expect(page.getAllByRole('option')).toHaveLength(1));
    const [match] = page.getAllByRole('option');
    await expect(match).toHaveTextContent('Toggle dark theme');
    await expect(match.querySelectorAll('mark').length).toBeGreaterThan(0);
    await userEvent.clear(input);
    await userEvent.type(input, 'tools');
    await waitFor(() =>
      expect(page.getAllByRole('option')[0]).toHaveTextContent('Manage MCP servers')
    );
    await userEvent.clear(input);
    await userEvent.type(input, 'qqqq');
    await expect(await page.findByText('No commands found')).toBeInTheDocument();
  },
};

export const EnterFlow = {
  args: flowArgs(),
  render: (args: FlowArgs) => <FlowPalette args={args} />,
  play: async ({ canvasElement, args }: FlowContext) => {
    const canvas = within(canvasElement);
    const page = pageOf(canvasElement);
    const input = await page.findByRole('combobox', { name: 'Search commands' });
    const options = page.getAllByRole('option');
    await expect(options[0]).toHaveAttribute('aria-selected', 'true');
    await userEvent.type(input, '{ArrowDown}{ArrowDown}');
    await expect(options[2]).toHaveAttribute('aria-selected', 'true');
    await userEvent.type(input, '{ArrowUp}');
    await expect(options[1]).toHaveAttribute('aria-selected', 'true');
    await expect(input).toHaveAttribute('aria-activedescendant', options[1].id);
    await userEvent.type(input, '{Enter}');
    await expect(args.onRun).toHaveBeenCalledWith('clear');
    await expect(args.onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'clear' }));
    await expect(args.onClose).toHaveBeenCalledTimes(1);
    await expect(await canvas.findByText('Ran clear')).toBeInTheDocument();
  },
};

export const RecentFlow = {
  args: flowArgs(),
  render: (args: FlowArgs) => <FlowPalette args={args} recentIds={['theme', 'mcp']} />,
  play: async ({ canvasElement, args }: FlowContext) => {
    const page = pageOf(canvasElement);
    const input = await page.findByRole('combobox', { name: 'Search commands' });
    const recent = page.getByRole('group', { name: 'Recent' });
    const recentOptions = within(recent).getAllByRole('option');
    await expect(recentOptions.map((option) => option.textContent)).toEqual([
      expect.stringContaining('Toggle dark theme'),
      expect.stringContaining('Manage MCP servers'),
    ]);
    await userEvent.type(input, 'new');
    await waitFor(() =>
      expect(page.queryByRole('group', { name: 'Recent' })).not.toBeInTheDocument()
    );
    await userEvent.clear(input);
    await userEvent.click(
      within(page.getByRole('group', { name: 'Recent' })).getAllByRole('option')[1]
    );
    await expect(args.onRun).toHaveBeenCalledWith('mcp');
  },
};
