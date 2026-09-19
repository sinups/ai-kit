import React from 'react';
import { expect, fn, userEvent, within } from '@storybook/test';
import { Group } from '@mantine/core';
import { InputBar } from '../input/InputBar';
import { NARROW_WIDTH, WIDE_WIDTH, WidthFrame } from '../_stories/WidthFrame';
import { ContextUsage } from './ContextUsage';

export default { title: 'Status/ContextUsage' };

const segments = [
  { label: 'System prompt', value: 4200 },
  { label: 'Tools', value: 18_600 },
  { label: 'Messages', value: 22_400 },
];

export function Usage() {
  return (
    <Group p={80} gap={24}>
      <ContextUsage used={45_200} total={200_000} segments={segments} withLabel />
      <ContextUsage used={168_000} total={200_000} withLabel onCompact={() => {}} />
      <ContextUsage used={194_000} total={200_000} withLabel onCompact={() => {}} />
    </Group>
  );
}

function InInputBar({ width }: { width: number }) {
  return (
    <WidthFrame width={width}>
      <InputBar
        status="ready"
        onSend={() => {}}
        onStop={() => {}}
        contentWidth="100%"
        rightActions={
          <ContextUsage
            used={168_000}
            total={200_000}
            segments={[
              { label: 'System prompt', value: 12_000 },
              { label: 'Tools', value: 64_000 },
              { label: 'Messages', value: 92_000 },
            ]}
            onCompact={() => {}}
          />
        }
      />
    </WidthFrame>
  );
}

export function NarrowInputBar() {
  return <InInputBar width={NARROW_WIDTH} />;
}

export function WideInputBar() {
  return <InInputBar width={WIDE_WIDTH} />;
}

export const CompactFlow = {
  args: { onCompact: fn() },
  render: ({ onCompact }: { onCompact: () => void }) => (
    <Group p="xl">
      <ContextUsage
        used={196_000}
        total={200_000}
        segments={[
          { label: 'System', value: 6000 },
          { label: 'Messages', value: 190_000 },
        ]}
        onCompact={onCompact}
        withLabel
      />
    </Group>
  ),
  play: async ({
    canvasElement,
    args,
  }: {
    canvasElement: HTMLElement;
    args: { onCompact: () => void };
  }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Context usage: 98%' }));
    const page = within(canvasElement.ownerDocument.body);
    await expect(await page.findByText('196k / 200k tokens · 98%')).toBeInTheDocument();
    await expect(page.getByText('Messages')).toBeInTheDocument();
    await userEvent.click(page.getByRole('button', { name: 'Compact conversation' }));
    await expect(args.onCompact).toHaveBeenCalledTimes(1);
  },
};
