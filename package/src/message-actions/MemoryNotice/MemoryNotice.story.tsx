import React from 'react';
import { Stack } from '@mantine/core';
import { expect, fn, userEvent, waitFor, within } from '@storybook/test';
import { NARROW_WIDTH, WIDE_WIDTH, WidthFrame } from '../../_stories/WidthFrame';
import { wait } from '../_story-helpers';
import { MemoryNotice } from './MemoryNotice';

export default { title: 'Messages/MemoryNotice' };

const CONTENT = `Use **yarn**, not npm, in this repository.

- Run \`yarn jest <path>\` for a single module
- Storybook runs on port 8271`;

function Demo({ fail = false }: { fail?: boolean }) {
  return (
    <Stack gap="sm">
      <MemoryNotice
        content={CONTENT}
        target="AGENTS.md"
        onOpen={() => {}}
        onUndo={async () => {
          await wait(600);
          if (fail) {
            throw new Error('Memory file is read-only');
          }
        }}
      />
      <MemoryNotice content="Prefers answers in Russian" />
    </Stack>
  );
}

export function Usage() {
  return (
    <Stack p="xl" maw={520}>
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

export function UndoError() {
  return (
    <Stack p="xl" maw={520}>
      <Demo fail />
    </Stack>
  );
}

function renderMemoryFlow(args: Record<string, any>) {
  return (
    <Stack p="xl" maw={520}>
      <MemoryNotice
        content={CONTENT}
        target="AGENTS.md"
        onOpen={args.onOpen}
        onUndo={args.onUndo}
      />
    </Stack>
  );
}

export const OpenAndUndoFlow = {
  args: { onOpen: fn(), onUndo: fn() },
  render: renderMemoryFlow,
  play: async ({
    canvasElement,
    args,
  }: {
    canvasElement: HTMLElement;
    args: Record<string, any>;
  }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole('button', { expanded: false });
    await userEvent.click(toggle);
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await waitFor(() => expect(canvas.getByText('Storybook runs on port 8271')).toBeVisible());
    await userEvent.click(canvas.getByRole('button', { name: 'Open' }));
    await expect(args.onOpen).toHaveBeenCalledTimes(1);
    await userEvent.click(canvas.getByRole('button', { name: 'Undo' }));
    await expect(args.onUndo).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(canvas.getByText('Removed from memory · AGENTS.md')).toBeVisible());
    await expect(canvas.queryByRole('button', { name: 'Undo' })).toBeNull();
  },
};

export const UndoErrorFlow = {
  args: {
    onOpen: fn(),
    onUndo: fn(async () => {
      throw new Error('Memory file is read-only');
    }),
  },
  render: renderMemoryFlow,
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Undo' }));
    await expect(await canvas.findByRole('alert')).toHaveTextContent('Memory file is read-only');
    await expect(canvas.getByText('Saved to memory · AGENTS.md')).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Undo' })).toBeEnabled();
  },
};
