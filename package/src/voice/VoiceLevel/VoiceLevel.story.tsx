import React from 'react';
import { expect } from '@storybook/test';
import { Group } from '@mantine/core';
import { WIDE_WIDTH, WidthFrame } from '../../_stories/WidthFrame';
import { useWobble } from '../fixtures';
import { VoiceLevel } from './VoiceLevel';

export default { title: 'voice/VoiceLevel' };

type Canvas = { canvasElement: HTMLElement };

export function Usage() {
  const input = useWobble(true, 5);
  const output = useWobble(true, 3);
  return (
    <WidthFrame width={WIDE_WIDTH}>
      <Group gap="xl">
        <VoiceLevel levels={input} />
        <VoiceLevel levels={output} source="assistant" />
        <VoiceLevel levels={0.7} size="xs" />
        <VoiceLevel levels={[0.4, 0.9, 0.5]} active={false} />
      </Group>
    </WidthFrame>
  );
}

export const Bars = {
  render: () => (
    <WidthFrame width={WIDE_WIDTH}>
      <VoiceLevel levels={[0.2, 1, 0.6]} />
    </WidthFrame>
  ),
  play: async ({ canvasElement }: Canvas) => {
    const root = canvasElement.querySelector<HTMLElement>('[data-source="user"]')!;
    await expect(root).toHaveAttribute('aria-hidden', 'true');
    const levels = Array.from(root.children).map((bar) =>
      (bar as HTMLElement).style.getPropertyValue('--bar-level')
    );
    await expect(levels).toEqual(['0.2', '1', '0.6']);
  },
};
