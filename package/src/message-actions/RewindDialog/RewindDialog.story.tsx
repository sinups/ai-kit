import React, { useState } from 'react';
import { Button, Code, Stack } from '@mantine/core';
import { expect, fn, userEvent, waitFor, within } from '@storybook/test';
import { NARROW_WIDTH, WidthFrame } from '../../_stories/WidthFrame';
import { wait } from '../_story-helpers';
import { rewindConversation } from '../fixtures';
import type { RewindMode, RewindRequest, SummarizeRequest } from '../types';
import { RewindDialog } from './RewindDialog';

export default { title: 'Messages/RewindDialog' };

function Demo({
  fail = false,
  modes,
  withSummarize = false,
}: {
  fail?: boolean;
  modes?: RewindMode[];
  withSummarize?: boolean;
}) {
  const [opened, setOpened] = useState(true);
  const [result, setResult] = useState<RewindRequest | SummarizeRequest | null>(null);

  return (
    <Stack align="flex-start">
      <Button onClick={() => setOpened(true)}>Rewind…</Button>
      {result && <Code block>{JSON.stringify(result, null, 2)}</Code>}
      <RewindDialog
        opened={opened}
        onClose={() => setOpened(false)}
        messages={rewindConversation}
        modes={modes}
        onRewind={async (request) => {
          await wait(900);
          if (fail) {
            throw new Error('Checkpoint for this message is no longer available');
          }
          setResult(request);
        }}
        onSummarize={
          withSummarize
            ? async (request) => {
                await wait(900);
                if (fail) {
                  throw new Error('The summary model is busy, try again in a minute');
                }
                setResult(request);
              }
            : undefined
        }
      />
    </Stack>
  );
}

export function Usage() {
  return (
    <Stack p="xl">
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

export function ConversationOnly() {
  return (
    <Stack p="xl">
      <Demo modes={['conversation']} />
    </Stack>
  );
}

export function RewindError() {
  return (
    <Stack p="xl">
      <Demo fail />
    </Stack>
  );
}

export function Empty() {
  return (
    <Stack p="xl">
      <RewindDialog opened onClose={() => {}} messages={[]} onRewind={() => {}} />
    </Stack>
  );
}

export function WithSummarize() {
  return (
    <Stack p="xl">
      <Demo withSummarize />
    </Stack>
  );
}

export function WithSummarizeNarrow() {
  return (
    <WidthFrame width={NARROW_WIDTH}>
      <Demo withSummarize />
    </WidthFrame>
  );
}

export function SummarizeError() {
  return (
    <Stack p="xl">
      <Demo withSummarize fail />
    </Stack>
  );
}

export const RewindFlow = {
  args: { onRewind: fn(), onClose: fn() },
  render: (args: Record<string, any>) => (
    <RewindDialog
      opened
      messages={rewindConversation}
      onRewind={args.onRewind}
      onClose={args.onClose}
    />
  ),
  play: async ({
    canvasElement,
    args,
  }: {
    canvasElement: HTMLElement;
    args: Record<string, any>;
  }) => {
    const page = within(canvasElement.ownerDocument.body);
    const options = await page.findAllByRole('option');
    await userEvent.click(options[options.length - 1]);
    await userEvent.click(page.getByRole('radio', { name: /Messages and file changes/ }));
    await userEvent.click(page.getByRole('button', { name: 'Rewind' }));
    await expect(args.onRewind).toHaveBeenCalledWith({
      messageId: 'u1',
      mode: 'conversation-and-code',
    });
    await waitFor(() => expect(args.onClose).toHaveBeenCalled());
  },
};

export const RewindErrorFlow = {
  args: {
    onRewind: fn(async () => {
      throw new Error('Checkpoint for this message is no longer available');
    }),
    onClose: fn(),
  },
  render: (args: Record<string, any>) => (
    <RewindDialog
      opened
      messages={rewindConversation}
      onRewind={args.onRewind}
      onClose={args.onClose}
    />
  ),
  play: async ({
    canvasElement,
    args,
  }: {
    canvasElement: HTMLElement;
    args: Record<string, any>;
  }) => {
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(await page.findByRole('button', { name: 'Rewind' }));
    await waitFor(() =>
      expect(page.getByText('Checkpoint for this message is no longer available')).toBeVisible()
    );
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(args.onClose).not.toHaveBeenCalled();
  },
};
