import React, { useState } from 'react';
import { Stack } from '@mantine/core';
import { expect, fn, userEvent, within } from '@storybook/test';
import { NARROW_WIDTH, WIDE_WIDTH, WidthFrame } from '../_stories/WidthFrame';
import { stepMatchIndex } from './transcript-search';
import { TranscriptSearch } from './TranscriptSearch';

export default { title: 'Chat/TranscriptSearch' };

function Demo() {
  const [value, setValue] = useState('token');
  const [active, setActive] = useState(2);
  const total = value.trim() ? 12 : 0;
  return (
    <TranscriptSearch
      value={value}
      onChange={setValue}
      activeIndex={total ? active : -1}
      total={total}
      onNext={() => setActive((current) => stepMatchIndex(current, total, 1))}
      onPrevious={() => setActive((current) => stepMatchIndex(current, total, -1))}
      onClose={() => setValue('')}
    />
  );
}

export function Usage() {
  return (
    <Stack p="xl" maw={420}>
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

type FlowArgs = {
  onChange: (value: string) => void;
  onNext: () => void;
  onPrevious: () => void;
  onClose: () => void;
};

export const KeyboardFlow = {
  args: { onChange: fn(), onNext: fn(), onPrevious: fn(), onClose: fn() },
  render: (args: FlowArgs) => (
    <Stack p="xl" maw={420}>
      <TranscriptSearch value="token" activeIndex={2} total={12} {...args} />
    </Stack>
  ),
  play: async ({ canvasElement, args }: { canvasElement: HTMLElement; args: FlowArgs }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('3/12')).toBeInTheDocument();
    const input = canvas.getByRole('textbox', { name: 'Search conversation' });
    await userEvent.type(input, '{Enter}');
    await expect(args.onNext).toHaveBeenCalledTimes(1);
    await userEvent.type(input, '{Shift>}{Enter}{/Shift}');
    await expect(args.onPrevious).toHaveBeenCalledTimes(1);
    await userEvent.click(canvas.getByRole('button', { name: 'Next match' }));
    await expect(args.onNext).toHaveBeenCalledTimes(2);
    await userEvent.type(input, 's');
    await expect(args.onChange).toHaveBeenCalledWith('tokens');
    await userEvent.type(input, '{Escape}');
    await expect(args.onClose).toHaveBeenCalledTimes(1);
  },
};

export function NavigationFlow() {
  return (
    <Stack p="xl" maw={420}>
      <Demo />
    </Stack>
  );
}

NavigationFlow.play = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
  const canvas = within(canvasElement);
  const input = canvas.getByRole('textbox', { name: 'Search conversation' });
  await expect(canvas.getByText('3/12')).toBeInTheDocument();
  await userEvent.type(input, '{Enter}');
  await expect(canvas.getByText('4/12')).toBeInTheDocument();
  await userEvent.click(canvas.getByRole('button', { name: 'Previous match' }));
  await userEvent.click(canvas.getByRole('button', { name: 'Previous match' }));
  await expect(canvas.getByText('2/12')).toBeInTheDocument();
  await userEvent.clear(input);
  await expect(canvas.getByRole('button', { name: 'Next match' })).toBeDisabled();
};
