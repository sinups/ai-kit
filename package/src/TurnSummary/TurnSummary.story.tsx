import React from 'react';
import { expect, within } from '@storybook/test';
import { Stack } from '@mantine/core';
import { NARROW_WIDTH, WIDE_WIDTH, WidthFrame } from '../_stories/WidthFrame';
import { TurnSummary } from './TurnSummary';

export default { title: 'Status/TurnSummary' };

function Demo() {
  return (
    <Stack gap="sm">
      <TurnSummary durationMs={123_000} tokens={40_000} tokenBudget={100_000} backgroundTasks={2} />
      <TurnSummary durationMs={8_000} tokens={1_200} />
      <TurnSummary durationMs={3_900_000} />
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

export function SummaryFlow() {
  return (
    <Stack p="xl" maw={520}>
      <TurnSummary durationMs={123_000} tokens={40_000} tokenBudget={100_000} backgroundTasks={2} />
      <TurnSummary durationMs={5000} labels={{ worked: (duration) => `Ran ${duration}` }} />
    </Stack>
  );
}

SummaryFlow.play = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
  const canvas = within(canvasElement);
  const [first, second] = canvas.getAllByRole('status');
  await expect(first).toHaveTextContent('Took 2m 3s · 40k / 100k · 2 tasks left running');
  await expect(second).toHaveTextContent('Ran 5s');
};
