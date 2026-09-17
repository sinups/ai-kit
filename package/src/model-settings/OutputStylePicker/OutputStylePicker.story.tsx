import React, { useState } from 'react';
import { expect, fn, userEvent, within } from '@storybook/test';
import { Stack } from '@mantine/core';
import { NARROW_WIDTH, WIDE_WIDTH, WidthFrame } from '../../_stories/WidthFrame';
import { OUTPUT_STYLES } from '../fixtures';
import { OutputStylePicker } from './OutputStylePicker';

export default { title: 'model-settings/OutputStylePicker' };

function Demo() {
  const [value, setValue] = useState('default');
  return (
    <OutputStylePicker
      styles={OUTPUT_STYLES}
      value={value}
      onChange={setValue}
      label="Output style"
      description="How the agent writes its answers"
    />
  );
}

export function Usage() {
  return (
    <Stack p="xl" maw={640}>
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

interface SelectFlowArgs {
  onChange: (id: string) => void;
}

export function SelectFlow(args: SelectFlowArgs) {
  const [value, setValue] = useState('default');
  return (
    <Stack p="xl" maw={640}>
      <OutputStylePicker
        styles={OUTPUT_STYLES}
        value={value}
        onChange={(id) => {
          setValue(id);
          args.onChange(id);
        }}
        label="Output style"
      />
    </Stack>
  );
}

SelectFlow.args = { onChange: fn() };

SelectFlow.play = async ({
  canvasElement,
  args,
}: {
  canvasElement: HTMLElement;
  args: SelectFlowArgs;
}) => {
  const canvas = within(canvasElement);
  await expect(canvas.getByRole('radio', { name: /Default/ })).toHaveAttribute(
    'aria-checked',
    'true'
  );
  await userEvent.click(canvas.getByRole('radio', { name: /Explanatory/ }));
  await expect(args.onChange).toHaveBeenCalledWith('explanatory');
  await expect(canvas.getByRole('radio', { name: /Explanatory/ })).toHaveAttribute(
    'aria-checked',
    'true'
  );
  await expect(canvas.getByRole('radio', { name: /Default/ })).toHaveAttribute(
    'aria-checked',
    'false'
  );
};
