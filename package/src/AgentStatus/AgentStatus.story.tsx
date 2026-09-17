import React, { useEffect, useState } from 'react';
import { expect, fn, userEvent, within } from '@storybook/test';
import { Stack } from '@mantine/core';
import { NARROW_WIDTH, WIDE_WIDTH, WidthFrame } from '../_stories/WidthFrame';
import { AgentStatus } from './AgentStatus';

export default { title: 'AgentStatus' };

function Demo() {
  const [startedAt] = useState(() => Date.now());
  const [tokens, setTokens] = useState(0);
  const [lastActivityAt, setLastActivityAt] = useState(startedAt);

  useEffect(() => {
    const id = window.setInterval(() => {
      setTokens((value) => value + 137);
      setLastActivityAt(Date.now());
    }, 400);
    const stop = window.setTimeout(() => window.clearInterval(id), 5000);
    return () => {
      window.clearInterval(id);
      window.clearTimeout(stop);
    };
  }, []);

  return (
    <Stack>
      <AgentStatus
        startedAt={startedAt}
        tokens={tokens}
        lastActivityAt={lastActivityAt}
        labels={{ stalled: 'Waiting for response' }}
        onStop={() => {}}
      />
      <AgentStatus label="Running tools" startedAt={startedAt} paused />
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

export function Stalled() {
  const [startedAt] = useState(() => Date.now() - 12_000);
  return (
    <WidthFrame width={NARROW_WIDTH}>
      <AgentStatus
        startedAt={startedAt}
        tokens={4210}
        lastActivityAt={startedAt}
        labels={{ stalled: 'Waiting for response' }}
        onStop={() => {}}
      />
    </WidthFrame>
  );
}

export const StopFlow = {
  args: { onStop: fn() },
  render: ({ onStop }: { onStop: () => void }) => (
    <Stack p="xl" maw={480}>
      <AgentStatus
        startedAt={Date.now()}
        lastActivityAt={Date.now()}
        tokens={1234}
        onStop={onStop}
      />
    </Stack>
  ),
  play: async ({
    canvasElement,
    args,
  }: {
    canvasElement: HTMLElement;
    args: { onStop: () => void };
  }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Thinking')).toBeInTheDocument();
    await expect(canvas.getByText('↓ 1.2k tokens')).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: 'Stop' }));
    await expect(args.onStop).toHaveBeenCalledTimes(1);
  },
};
