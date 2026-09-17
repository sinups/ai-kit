import React, { useState } from 'react';
import { expect, fn, userEvent, within } from '@storybook/test';
import { NARROW_WIDTH, WIDE_WIDTH, WidthFrame } from '../_stories/WidthFrame';
import { PermissionModeSelector, type PermissionModeSelectorProps } from './PermissionModeSelector';
import type { PermissionMode } from './types';

export default { title: 'permissions/PermissionModeSelector' };

function Selector({
  initial = 'default',
  ...props
}: Partial<PermissionModeSelectorProps> & { initial?: PermissionMode }) {
  const [mode, setMode] = useState<PermissionMode>(initial);
  return <PermissionModeSelector {...props} value={mode} onChange={setMode} />;
}

export function Usage() {
  return (
    <WidthFrame width={560}>
      <Selector />
    </WidthFrame>
  );
}

export function Bypass() {
  return (
    <WidthFrame width={560}>
      <Selector initial="bypass" />
    </WidthFrame>
  );
}

export function Narrow() {
  return (
    <WidthFrame width={NARROW_WIDTH}>
      <Selector initial="acceptEdits" />
    </WidthFrame>
  );
}

export function Wide() {
  return (
    <WidthFrame width={WIDE_WIDTH}>
      <Selector initial="plan" />
    </WidthFrame>
  );
}

type ModeFlowArgs = { onChange: (mode: PermissionMode) => void };

function FlowSelector({ args }: { args: ModeFlowArgs }) {
  const [mode, setMode] = useState<PermissionMode>('default');
  return (
    <WidthFrame width={560}>
      <PermissionModeSelector
        variant="segmented"
        value={mode}
        onChange={(next) => {
          args.onChange(next);
          setMode(next);
        }}
      />
    </WidthFrame>
  );
}

export const BypassFlow = {
  args: { onChange: fn() },
  render: (args: ModeFlowArgs) => <FlowSelector args={args} />,
  play: async ({ args, canvasElement }: { args: ModeFlowArgs; canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByText(/isolated environment/)).not.toBeInTheDocument();
    await userEvent.click(canvas.getByRole('radio', { name: 'Bypass' }));
    await expect(args.onChange).toHaveBeenCalledWith('bypass');
    await expect(await canvas.findByText(/isolated environment/)).toBeInTheDocument();
    await expect(canvas.getByText(/Skip all permission prompts/)).toBeInTheDocument();
  },
};
