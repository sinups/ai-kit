import React, { useState } from 'react';
import { expect, fn, userEvent, within } from '@storybook/test';
import { Button, Stack, Text } from '@mantine/core';
import { NARROW_WIDTH, WIDE_WIDTH, WidthFrame } from '../_stories/WidthFrame';
import { InputBar } from '../input/InputBar';
import { IdleReturnPrompt } from './IdleReturnPrompt';
import { SpendThresholdNotice } from './SpendThresholdNotice';
import { ToolUnavailableNotice } from './ToolUnavailableNotice';

export default { title: 'Chat/Notices' };

function Notices() {
  const [log, setLog] = useState('');
  return (
    <Stack gap="sm">
      <IdleReturnPrompt
        awayMs={3 * 3_600_000}
        tokens={180_000}
        onContinue={() => setLog('Continue')}
        onNewChat={() => setLog('New chat with this message')}
        onDontAskAgain={() => setLog('Stop asking')}
      />
      <SpendThresholdNotice
        amount={5.2}
        limit={10}
        actions={[
          { label: 'View usage', onClick: () => setLog('View usage'), kind: 'primary' },
          { label: 'Set a limit', onClick: () => setLog('Set a limit') },
        ]}
        onDismiss={() => setLog('Dismissed')}
      />
      <ToolUnavailableNotice
        server="tracker"
        message="The connection dropped after three attempts."
        onRetry={() => setLog('Try again')}
        onDismiss={() => setLog('Dismissed')}
      />
      {log && (
        <Text size="xs" c="dimmed">
          {log}
        </Text>
      )}
    </Stack>
  );
}

export function Usage() {
  return (
    <Stack p="xl" maw={640}>
      <Notices />
    </Stack>
  );
}

export function Narrow() {
  return (
    <WidthFrame width={NARROW_WIDTH}>
      <Notices />
    </WidthFrame>
  );
}

export function Wide() {
  return (
    <WidthFrame width={WIDE_WIDTH}>
      <Notices />
    </WidthFrame>
  );
}

export function AboveInputBar() {
  const [notice, setNotice] = useState<'idle' | 'spend' | 'unavailable' | null>('idle');
  return (
    <WidthFrame width={WIDE_WIDTH}>
      <Stack gap="xs">
        {notice === 'idle' && (
          <IdleReturnPrompt
            awayMs={5 * 3_600_000}
            tokens={182_400}
            onContinue={() => setNotice('spend')}
            onNewChat={() => setNotice(null)}
            onDontAskAgain={() => setNotice(null)}
          />
        )}
        {notice === 'spend' && (
          <SpendThresholdNotice amount={5.2} onDismiss={() => setNotice('unavailable')} />
        )}
        {notice === 'unavailable' && (
          <ToolUnavailableNotice
            server="tracker"
            message="The connection dropped after three attempts."
            onRetry={() => setNotice('idle')}
            onDismiss={() => setNotice(null)}
          />
        )}
        {notice === null && (
          <Button variant="default" size="xs" onClick={() => setNotice('idle')}>
            Show again
          </Button>
        )}
        <InputBar status="ready" onSend={() => {}} onStop={() => {}} contentWidth="100%" />
      </Stack>
    </WidthFrame>
  );
}

type IdleArgs = { onContinue: () => void; onNewChat: () => void; onDontAskAgain: () => void };

export const IdleReturnFlow = {
  args: { onContinue: fn(), onNewChat: fn(), onDontAskAgain: fn() },
  render: (args: IdleArgs) => (
    <Stack p="xl" maw={520}>
      <IdleReturnPrompt awayMs={3 * 3_600_000 + 60_000} tokens={180_000} {...args} />
    </Stack>
  ),
  play: async ({ canvasElement, args }: { canvasElement: HTMLElement; args: IdleArgs }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Welcome back, 3h since your last message.')).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: 'Continue' }));
    await userEvent.click(canvas.getByRole('button', { name: 'New chat with this message' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Stop asking' }));
    await expect(args.onContinue).toHaveBeenCalledTimes(1);
    await expect(args.onNewChat).toHaveBeenCalledTimes(1);
    await expect(args.onDontAskAgain).toHaveBeenCalledTimes(1);
  },
};

type SpendArgs = { onViewUsage: () => void; onDismiss: () => void };

export const SpendThresholdFlow = {
  args: { onViewUsage: fn(), onDismiss: fn() },
  render: (args: SpendArgs) => (
    <Stack p="xl" maw={520}>
      <SpendThresholdNotice
        amount={5.2}
        limit={10}
        actions={[{ label: 'View usage', onClick: args.onViewUsage, kind: 'primary' }]}
        onDismiss={args.onDismiss}
      />
    </Stack>
  ),
  play: async ({ canvasElement, args }: { canvasElement: HTMLElement; args: SpendArgs }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Session cost is now $5.20.')).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: 'View usage' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Dismiss' }));
    await expect(args.onViewUsage).toHaveBeenCalledTimes(1);
    await expect(args.onDismiss).toHaveBeenCalledTimes(1);
  },
};

type ToolUnavailableArgs = { onRetry: () => void; onDismiss: () => void };

export const ToolUnavailableFlow = {
  args: { onRetry: fn(), onDismiss: fn() },
  render: (args: ToolUnavailableArgs) => (
    <Stack p="xl" maw={520}>
      <ToolUnavailableNotice
        server="tracker"
        message="The connection dropped after three attempts."
        {...args}
      />
    </Stack>
  ),
  play: async ({
    canvasElement,
    args,
  }: {
    canvasElement: HTMLElement;
    args: ToolUnavailableArgs;
  }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('tracker is unavailable.')).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: 'Try again' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Dismiss' }));
    await expect(args.onRetry).toHaveBeenCalledTimes(1);
    await expect(args.onDismiss).toHaveBeenCalledTimes(1);
  },
};
