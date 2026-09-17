import React, { useState } from 'react';
import { expect, fn, userEvent, within } from '@storybook/test';
import { Text } from '@mantine/core';
import { NARROW_WIDTH, WIDE_WIDTH, WidthFrame } from '../_stories/WidthFrame';
import { skills } from './fixtures';
import { SkillPicker } from './SkillPicker';

export default { title: 'skills/SkillPicker' };

function Demo() {
  const [value, setValue] = useState<string[]>(['pdf', 'code-review']);
  return (
    <>
      <SkillPicker
        label="Skills"
        description="The agent loads these skills when they match the task"
        skills={skills}
        value={value}
        onChange={setValue}
      />
      <Text size="xs" c="dimmed" mt="xs">
        {value.join(', ') || 'Nothing picked'}
      </Text>
    </>
  );
}

export function Usage() {
  return (
    <WidthFrame width={480}>
      <Demo />
    </WidthFrame>
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

export function PickFlow(args: { onChange: (value: string[]) => void }) {
  const [value, setValue] = useState<string[]>(['pdf']);
  return (
    <WidthFrame width={480}>
      <SkillPicker
        label="Skills"
        skills={skills}
        value={value}
        onChange={(next) => {
          setValue(next);
          args.onChange(next);
        }}
      />
      <Text size="xs" c="dimmed" mt="xs" data-testid="picked">
        {value.join(', ') || 'Nothing picked'}
      </Text>
    </WidthFrame>
  );
}

PickFlow.args = { onChange: fn() };

PickFlow.play = async ({
  canvasElement,
  args,
}: {
  canvasElement: HTMLElement;
  args: { onChange: (value: string[]) => void };
}) => {
  const canvas = within(canvasElement);
  const page = within(canvasElement.ownerDocument.body);
  const input = canvas.getByRole('textbox', { name: 'Skills' });

  await userEvent.type(input, 'relnotes');
  await expect(await page.findByRole('option', { name: /release-notes/ })).toBeInTheDocument();
  await userEvent.keyboard('{Enter}');
  await expect(args.onChange).toHaveBeenLastCalledWith(['pdf', 'release-notes']);
  await expect(canvas.getByTestId('picked')).toHaveTextContent('pdf, release-notes');

  await userEvent.clear(input);
  await userEvent.type(input, 'qqqq');
  await expect(await page.findByText('No skills found')).toBeInTheDocument();

  await userEvent.clear(input);
  await userEvent.keyboard('{Backspace}');
  await expect(args.onChange).toHaveBeenLastCalledWith(['pdf']);
  await userEvent.keyboard('{Backspace}');
  await expect(args.onChange).toHaveBeenLastCalledWith([]);
  await expect(canvas.getByTestId('picked')).toHaveTextContent('Nothing picked');
};
