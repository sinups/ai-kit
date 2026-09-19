import React, { useState } from 'react';
import { Button, Stack, Text } from '@mantine/core';
import { expect, fn, userEvent, waitFor, within } from '@storybook/test';
import { NARROW_WIDTH, WIDE_WIDTH, WidthFrame } from '../../_stories/WidthFrame';
import { wait } from '../_story-helpers';
import { EditMessageComposer } from './EditMessageComposer';

export default { title: 'Messages/EditMessageComposer' };

function Demo({ fail = false }: { fail?: boolean }) {
  const [editing, setEditing] = useState(true);
  const [text, setText] = useState('Refactor the auth module and add tests for token refresh.');

  if (!editing) {
    return (
      <Stack gap="xs" align="flex-start">
        <Text size="sm">{text}</Text>
        <Button size="xs" variant="default" onClick={() => setEditing(true)}>
          Edit again
        </Button>
      </Stack>
    );
  }

  return (
    <EditMessageComposer
      defaultValue={text}
      onCancel={() => setEditing(false)}
      onSubmit={async (next) => {
        await wait(800);
        if (fail) {
          throw new Error('The agent is busy, try again in a moment');
        }
        setText(next);
        setEditing(false);
      }}
    />
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

export function ResendError() {
  return (
    <Stack p="xl" maw={520}>
      <Demo fail />
    </Stack>
  );
}

function renderEditFlow(args: Record<string, any>) {
  return (
    <Stack p="xl" maw={520}>
      <EditMessageComposer
        defaultValue="Refactor the auth module"
        onSubmit={args.onSubmit}
        onCancel={args.onCancel}
      />
    </Stack>
  );
}

export const ResendFlow = {
  args: { onSubmit: fn(), onCancel: fn() },
  render: renderEditFlow,
  play: async ({
    canvasElement,
    args,
  }: {
    canvasElement: HTMLElement;
    args: Record<string, any>;
  }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('textbox', { name: 'Edit message' });
    await userEvent.type(input, '{Shift>}{Enter}{/Shift}and add tests  ');
    await expect(args.onSubmit).not.toHaveBeenCalled();
    await userEvent.type(input, '{Enter}');
    await expect(args.onSubmit).toHaveBeenCalledWith('Refactor the auth module\nand add tests');
  },
};

export const CancelFlow = {
  args: { onSubmit: fn(), onCancel: fn() },
  render: renderEditFlow,
  play: async ({
    canvasElement,
    args,
  }: {
    canvasElement: HTMLElement;
    args: Record<string, any>;
  }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('textbox', { name: 'Edit message' });
    await userEvent.clear(input);
    await expect(canvas.getByRole('button', { name: 'Save & resend' })).toBeDisabled();
    await userEvent.type(input, '{Escape}');
    await expect(args.onCancel).toHaveBeenCalledTimes(1);
    await expect(args.onSubmit).not.toHaveBeenCalled();
  },
};

export const ResendErrorFlow = {
  args: {
    onSubmit: fn(async () => {
      throw new Error('The agent is busy, try again in a moment');
    }),
    onCancel: fn(),
  },
  render: renderEditFlow,
  play: async ({
    canvasElement,
    args,
  }: {
    canvasElement: HTMLElement;
    args: Record<string, any>;
  }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Save & resend' }));
    await expect(args.onSubmit).toHaveBeenCalledWith('Refactor the auth module');
    await waitFor(() =>
      expect(canvas.getByText('The agent is busy, try again in a moment')).toBeVisible()
    );
    await waitFor(() =>
      expect(canvas.getByRole('button', { name: 'Save & resend' })).toBeEnabled()
    );
    await expect(canvas.getByRole('textbox', { name: 'Edit message' })).toHaveValue(
      'Refactor the auth module'
    );
  },
};
