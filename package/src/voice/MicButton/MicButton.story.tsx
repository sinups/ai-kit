import React, { useEffect, useState } from 'react';
import { expect, fn, userEvent, within } from '@storybook/test';
import { Group, Stack, Text } from '@mantine/core';
import { NARROW_WIDTH, WIDE_WIDTH, WidthFrame } from '../../_stories/WidthFrame';
import { InputBar } from '../../input/InputBar';
import { useWobble } from '../fixtures';
import { MicButton, type MicState } from './MicButton';

export default { title: 'voice/MicButton' };

type Canvas = { canvasElement: HTMLElement };

const STATES: MicState[] = [
  'idle',
  'requesting',
  'listening',
  'processing',
  'error',
  'unsupported',
];

export function States() {
  const [level] = useWobble(true);
  return (
    <WidthFrame width={WIDE_WIDTH}>
      <Group gap="lg">
        {STATES.map((state) => (
          <Stack key={state} gap={6} align="center">
            <MicButton state={state} level={level} error="Permission denied" />
            <Text size="xs" c="dimmed">
              {state}
            </Text>
          </Stack>
        ))}
      </Group>
    </WidthFrame>
  );
}

function DictationComposer({ onToggle }: { onToggle: (state: MicState) => void }) {
  const [state, setState] = useState<MicState>('idle');
  const [level] = useWobble(state === 'listening');
  const toggle = () => {
    onToggle(state);
    setState((current) => (current === 'listening' ? 'processing' : 'listening'));
  };
  useEffect(() => {
    if (state !== 'processing') {
      return undefined;
    }
    const timer = setTimeout(() => setState('idle'), 1500);
    return () => clearTimeout(timer);
  }, [state]);

  return (
    <InputBar
      status="ready"
      onSend={() => {}}
      onStop={() => {}}
      contentWidth="100%"
      rightActions={<MicButton state={state} level={level} onToggle={toggle} />}
    />
  );
}

export function InComposer() {
  return (
    <WidthFrame width={NARROW_WIDTH}>
      <DictationComposer onToggle={() => {}} />
    </WidthFrame>
  );
}

export const Dictation = {
  args: { onToggle: fn() },
  render: ({ onToggle }: { onToggle: (state: MicState) => void }) => (
    <WidthFrame width={NARROW_WIDTH}>
      <DictationComposer onToggle={onToggle} />
    </WidthFrame>
  ),
  play: async ({ canvasElement, args }: Canvas & { args: { onToggle: ReturnType<typeof fn> } }) => {
    const canvas = within(canvasElement);
    const mic = canvas.getByRole('button', { name: 'Dictation' });
    await expect(mic).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(mic);
    await expect(mic).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(mic);
    await expect(mic).toHaveAttribute('aria-busy', 'true');
    await expect(mic).toHaveAccessibleDescription('Transcribing');
    await expect(args.onToggle).toHaveBeenNthCalledWith(1, 'idle');
    await expect(args.onToggle).toHaveBeenNthCalledWith(2, 'listening');
  },
};
