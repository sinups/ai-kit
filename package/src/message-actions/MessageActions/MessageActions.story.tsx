import React, { useState } from 'react';
import { Box, Paper, Stack, Text } from '@mantine/core';
import { expect, fn, userEvent, waitFor, within } from '@storybook/test';
import { NARROW_WIDTH, WIDE_WIDTH, WidthFrame } from '../../_stories/WidthFrame';
import { wait } from '../_story-helpers';
import type { MessageFeedbackValue } from '../types';
import { MessageActions } from './MessageActions';

export default { title: 'Messages/MessageActions' };

function Demo({ visibility = 'always' }: { visibility?: 'hover' | 'always' }) {
  const [log, setLog] = useState<string[]>([]);
  const push = (entry: string) => setLog((current) => [entry, ...current].slice(0, 5));

  return (
    <Stack gap="lg">
      <Box data-message-actions-host>
        <Text size="xs" c="dimmed">
          User message
        </Text>
        <MessageActions
          messageRole="user"
          align="end"
          text="Refactor the auth module"
          timestamp="10:42 AM"
          visibility={visibility}
          onEdit={() => push('edit')}
          onRewind={async () => {
            await wait(600);
            push('rewind');
          }}
        />
      </Box>
      <Box data-message-actions-host>
        <Text size="xs" c="dimmed">
          Assistant message
        </Text>
        <MessageActions
          messageRole="assistant"
          text="Here is the refactored module."
          visibility={visibility}
          onRetry={async () => {
            await wait(800);
            push('retry');
          }}
          onBranch={() => push('branch')}
          onFeedback={async (value: MessageFeedbackValue, details) => {
            await wait(500);
            push(`feedback ${value} ${details ? JSON.stringify(details) : ''}`);
          }}
        />
      </Box>
      {log.length > 0 && (
        <Paper withBorder p="xs" radius="md">
          {log.map((entry, index) => (
            <Text key={`${entry}-${index}`} size="xs" ff="monospace">
              {entry}
            </Text>
          ))}
        </Paper>
      )}
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

export function RevealOnHover() {
  return (
    <Stack p="xl" maw={520}>
      <Text size="sm" c="dimmed">
        Hover a block or tab into it to reveal the actions; touch devices always see them.
      </Text>
      <Demo visibility="hover" />
    </Stack>
  );
}

export function Disabled() {
  return (
    <Stack p="xl" maw={520}>
      <MessageActions
        messageRole="assistant"
        text="Streaming answer"
        visibility="always"
        disabled
        feedback="up"
        onRetry={() => {}}
        onBranch={() => {}}
        onFeedback={() => {}}
      />
    </Stack>
  );
}

export const RetryFlow = {
  args: {
    onRetry: fn(() => wait(400)),
    onBranch: fn(),
  },
  render: (args: Record<string, any>) => (
    <Stack p="xl" maw={520}>
      <MessageActions
        messageRole="assistant"
        text="Answer"
        visibility="always"
        onRetry={args.onRetry}
        onBranch={args.onBranch}
      />
    </Stack>
  ),
  play: async ({
    canvasElement,
    args,
  }: {
    canvasElement: HTMLElement;
    args: Record<string, any>;
  }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Retry' }));
    await expect(args.onRetry).toHaveBeenCalledTimes(1);
    await expect(canvas.getByRole('button', { name: 'Branch from here' })).toBeDisabled();
    await waitFor(() =>
      expect(canvas.getByRole('button', { name: 'Branch from here' })).toBeEnabled()
    );
  },
};

function renderFeedbackFlow(args: Record<string, any>) {
  return (
    <Stack p="xl" maw={520}>
      <MessageActions
        messageRole="assistant"
        text="Answer"
        visibility="always"
        onFeedback={args.onFeedback}
      />
    </Stack>
  );
}

export const GoodFeedbackFlow = {
  args: { onFeedback: fn() },
  render: renderFeedbackFlow,
  play: async ({
    canvasElement,
    args,
  }: {
    canvasElement: HTMLElement;
    args: Record<string, any>;
  }) => {
    const canvas = within(canvasElement);
    const good = canvas.getByRole('button', { name: 'Good response' });
    await userEvent.click(good);
    await expect(args.onFeedback).toHaveBeenCalledWith('up');
    await expect(good).toHaveAttribute('aria-pressed', 'true');
    await waitFor(() =>
      expect(
        within(canvasElement.ownerDocument.body).getByText('Thanks for your feedback')
      ).toBeVisible()
    );
  },
};

export const BadFeedbackFlow = {
  args: { onFeedback: fn() },
  render: renderFeedbackFlow,
  play: async ({
    canvasElement,
    args,
  }: {
    canvasElement: HTMLElement;
    args: Record<string, any>;
  }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole('button', { name: 'Bad response' }));
    await expect(args.onFeedback).not.toHaveBeenCalled();
    await userEvent.click(await page.findByRole('checkbox', { name: 'Not helpful' }));
    await userEvent.type(page.getByRole('textbox', { name: 'Details' }), 'Missed the question');
    await userEvent.click(page.getByRole('button', { name: 'Send feedback' }));
    await expect(args.onFeedback).toHaveBeenCalledWith('down', {
      reasons: ['not-helpful'],
      comment: 'Missed the question',
    });
    await waitFor(() => expect(page.getByText('Thanks for your feedback')).toBeVisible());
    await expect(canvas.getByRole('button', { name: 'Bad response' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  },
};
