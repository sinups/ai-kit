import React from 'react';
import { Group, Paper, Stack, Text } from '@mantine/core';
import { expect, within } from '@storybook/test';
import { NARROW_WIDTH, WIDE_WIDTH, WidthFrame } from '../../_stories/WidthFrame';
import { ShortcutHint } from './ShortcutHint';

export default { title: 'primitives/ShortcutHint' };

const SHORTCUTS = [
  { label: 'Command palette', keys: 'mod+K' },
  { label: 'New line', keys: 'shift+enter' },
  { label: 'Stop generation', keys: 'esc' },
  { label: 'Previous message', keys: 'alt+up' },
  { label: 'Zoom in', keys: 'mod++' },
];

export function Usage() {
  return (
    <Stack p="xl" gap="md">
      <ShortcutHint keys="mod+K" label="Search" />
      <Group gap="xl">
        <ShortcutHint keys="mod+shift+P" platform="mac" label="macOS" />
        <ShortcutHint keys="mod+shift+P" platform="other" label="Windows / Linux" />
      </Group>
      <Group gap="xl">
        {(['xs', 'sm', 'md'] as const).map((size) => (
          <ShortcutHint key={size} keys={['mod', 'enter']} size={size} />
        ))}
      </Group>
    </Stack>
  );
}

function ShortcutList() {
  return (
    <Paper withBorder radius="md" p="sm">
      <Stack gap="xs">
        {SHORTCUTS.map((shortcut) => (
          <Group key={shortcut.label} justify="space-between" wrap="nowrap" gap="sm">
            <Text size="sm" truncate>
              {shortcut.label}
            </Text>
            <ShortcutHint keys={shortcut.keys} />
          </Group>
        ))}
      </Stack>
    </Paper>
  );
}

export function Narrow() {
  return (
    <WidthFrame width={NARROW_WIDTH}>
      <ShortcutList />
    </WidthFrame>
  );
}

export function Wide() {
  return (
    <WidthFrame width={WIDE_WIDTH}>
      <ShortcutList />
    </WidthFrame>
  );
}

export function RenderFlow() {
  return (
    <Stack p="xl" gap="md">
      <ShortcutHint keys="mod+shift+P" platform="mac" label="macOS" />
      <ShortcutHint keys="mod+shift+P" platform="other" label="Windows" />
      <ShortcutHint keys="mod++" platform="other" label="Zoom" />
    </Stack>
  );
}

RenderFlow.play = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
  const canvas = within(canvasElement);
  const keysOf = (label: string) => {
    const row = canvas.getByText(label).parentElement as HTMLElement;
    return Array.from(row.querySelectorAll('kbd')).map((node) => node.textContent);
  };
  const separatorsOf = (label: string) =>
    within(canvas.getByText(label).parentElement as HTMLElement).queryAllByText('+', {
      selector: 'p, span',
    }).length;

  await expect(keysOf('macOS')).toEqual(['⌘', '⇧', 'P']);
  await expect(separatorsOf('macOS')).toBe(0);
  await expect(keysOf('Windows')).toEqual(['Ctrl', 'Shift', 'P']);
  await expect(separatorsOf('Windows')).toBe(2);
  await expect(keysOf('Zoom')).toEqual(['Ctrl', '+']);
};
