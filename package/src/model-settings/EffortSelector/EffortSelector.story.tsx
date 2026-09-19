import React, { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from '@storybook/test';
import { Stack } from '@mantine/core';
import { InputBar } from '../../input/InputBar';
import { NARROW_WIDTH, WIDE_WIDTH, WidthFrame } from '../../_stories/WidthFrame';
import type { EffortLevelValue } from '../types';
import { EffortSelector } from './EffortSelector';

export default { title: 'Settings/EffortSelector' };

function Demo() {
  const [value, setValue] = useState<EffortLevelValue>('high');
  const [thinking, setThinking] = useState(true);
  return (
    <EffortSelector
      value={value}
      onChange={setValue}
      thinking={thinking}
      onThinkingChange={setThinking}
    />
  );
}

export function Usage() {
  return (
    <Stack p="xl" maw={480}>
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

export function Inline() {
  const [value, setValue] = useState<EffortLevelValue>('medium');
  const [thinking, setThinking] = useState(false);
  const [draft, setDraft] = useState('');
  return (
    <Stack p="xl" pt={260} maw={520}>
      <InputBar
        value={draft}
        onChange={setDraft}
        onSend={() => setDraft('')}
        onStop={() => {}}
        status="ready"
        leftActions={
          <EffortSelector
            variant="inline"
            value={value}
            onChange={setValue}
            thinking={thinking}
            onThinkingChange={setThinking}
          />
        }
      />
    </Stack>
  );
}

export function CustomLevels() {
  const [value, setValue] = useState<EffortLevelValue>('auto');
  return (
    <Stack p="xl" maw={480}>
      <EffortSelector
        value={value}
        onChange={setValue}
        levels={[
          { value: 'auto', label: 'Auto', description: 'The model decides how long to think' },
          { value: 'fast', label: 'Fast', description: 'No extended reasoning' },
          { value: 'deep', label: 'Deep', description: 'Up to 32k reasoning tokens' },
        ]}
      />
    </Stack>
  );
}

interface InlineFlowArgs {
  onChange: (value: EffortLevelValue) => void;
  onThinkingChange: (thinking: boolean) => void;
}

export function InlineFlow(args: InlineFlowArgs) {
  const [value, setValue] = useState<EffortLevelValue>('medium');
  const [thinking, setThinking] = useState(false);
  return (
    <Stack p="xl" pt={320} maw={520}>
      <EffortSelector
        variant="inline"
        value={value}
        onChange={(next) => {
          setValue(next);
          args.onChange(next);
        }}
        thinking={thinking}
        onThinkingChange={(next) => {
          setThinking(next);
          args.onThinkingChange(next);
        }}
      />
    </Stack>
  );
}

InlineFlow.args = { onChange: fn(), onThinkingChange: fn() };

InlineFlow.play = async ({
  canvasElement,
  args,
}: {
  canvasElement: HTMLElement;
  args: InlineFlowArgs;
}) => {
  const canvas = within(canvasElement);
  const page = within(canvasElement.ownerDocument.body);

  await userEvent.click(canvas.getByRole('button', { name: 'Reasoning effort: Medium' }));
  await userEvent.click(await page.findByRole('menuitem', { name: /Extended thinking/ }));
  await expect(args.onThinkingChange).toHaveBeenCalledWith(true);
  await waitFor(() =>
    expect(page.getByRole('switch', { name: 'Extended thinking' })).toBeChecked()
  );

  await userEvent.click(page.getByRole('menuitem', { name: /High/ }));
  await expect(args.onChange).toHaveBeenCalledWith('high');
  await expect(
    await canvas.findByRole('button', { name: 'Reasoning effort: High' })
  ).toBeInTheDocument();
};
