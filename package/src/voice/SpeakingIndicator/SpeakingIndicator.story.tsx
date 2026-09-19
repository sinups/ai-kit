import React, { useState } from 'react';
import { expect, fn, userEvent, within } from '@storybook/test';
import { Paper, Stack, Text } from '@mantine/core';
import { NARROW_WIDTH, WIDE_WIDTH, WidthFrame } from '../../_stories/WidthFrame';
import { useWobble } from '../fixtures';
import { SpeakingIndicator } from './SpeakingIndicator';

export default { title: 'Voice/SpeakingIndicator' };

type Canvas = { canvasElement: HTMLElement };

function Speaking({ onStop }: { onStop: () => void }) {
  const [speaking, setSpeaking] = useState(true);
  const levels = useWobble(speaking, 3);
  return (
    <Stack gap="sm">
      <SpeakingIndicator
        speaking={speaking}
        levels={levels}
        onStop={() => {
          onStop();
          setSpeaking(false);
        }}
      />
      {!speaking && (
        <Text size="xs" c="dimmed">
          Stopped
        </Text>
      )}
    </Stack>
  );
}

export function Usage() {
  return (
    <WidthFrame width={WIDE_WIDTH}>
      <Paper withBorder radius="md" p="sm">
        <Speaking onStop={() => {}} />
      </Paper>
    </WidthFrame>
  );
}

export function Narrow() {
  return (
    <WidthFrame width={NARROW_WIDTH}>
      <Speaking onStop={() => {}} />
    </WidthFrame>
  );
}

export const StopSpeakingFlow = {
  args: { onStop: fn() },
  render: ({ onStop }: { onStop: () => void }) => (
    <WidthFrame width={WIDE_WIDTH}>
      <Speaking onStop={onStop} />
    </WidthFrame>
  ),
  play: async ({ canvasElement, args }: Canvas & { args: { onStop: ReturnType<typeof fn> } }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('status')).toHaveTextContent('Speaking');
    await userEvent.click(canvas.getByRole('button', { name: 'Stop speaking' }));
    await expect(args.onStop).toHaveBeenCalledTimes(1);
    await expect(await canvas.findByText('Stopped')).toBeInTheDocument();
    await expect(canvas.getByRole('status')).toBeEmptyDOMElement();
  },
};
