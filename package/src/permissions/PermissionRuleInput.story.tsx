import React, { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from '@storybook/test';
import { Stack } from '@mantine/core';
import { NARROW_WIDTH, WIDE_WIDTH, WidthFrame } from '../_stories/WidthFrame';
import { PERMISSION_TOOLS_FIXTURE } from './fixtures';
import { PermissionRuleInput, type PermissionRuleInputProps } from './PermissionRuleInput';

export default { title: 'Permissions & hooks/PermissionRuleInput' };

function Field(props: Partial<PermissionRuleInputProps>) {
  const [value, setValue] = useState(props.value ?? '');
  return (
    <PermissionRuleInput
      knownTools={PERMISSION_TOOLS_FIXTURE}
      {...props}
      value={value}
      onChange={setValue}
    />
  );
}

export function Usage() {
  return (
    <WidthFrame width={480}>
      <Field value="Bash(npm run test:*)" />
    </WidthFrame>
  );
}

export function States() {
  return (
    <WidthFrame width={480}>
      <Stack gap="lg">
        <Field label="Valid" value="WebFetch(domain:git.example.com)" />
        <Field label="Deny rule" behavior="deny" value="Read(.env*)" />
        <Field label="Unknown tool" value="Bsh(ls)" />
        <Field label="Invalid" value="Bash(npm run" forceValidation />
        <Field label="Disabled" value="mcp__git" disabled />
      </Stack>
    </WidthFrame>
  );
}

export function Narrow() {
  return (
    <WidthFrame width={NARROW_WIDTH}>
      <Field value="Bash(docker compose up --build --remove-orphans:*)" />
    </WidthFrame>
  );
}

export function Wide() {
  return (
    <WidthFrame width={WIDE_WIDTH}>
      <Field value="mcp__git__create_issue" />
    </WidthFrame>
  );
}

type InputFlowArgs = { onChange: (value: string) => void };

function FlowField({ args }: { args: InputFlowArgs }) {
  const [value, setValue] = useState('');
  return (
    <WidthFrame width={480}>
      <PermissionRuleInput
        knownTools={PERMISSION_TOOLS_FIXTURE}
        value={value}
        onChange={(next) => {
          args.onChange(next);
          setValue(next);
        }}
      />
    </WidthFrame>
  );
}

type InputFlowContext = { args: InputFlowArgs; canvasElement: HTMLElement };

export const CompletionFlow = {
  args: { onChange: fn() },
  render: (args: InputFlowArgs) => <FlowField args={args} />,
  play: async ({ args, canvasElement }: InputFlowContext) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('textbox', { name: 'Rule' });
    await userEvent.type(input, 'web');
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(await page.findByRole('option', { name: 'WebFetch' }));
    await waitFor(() => expect(input).toHaveValue('WebFetch'));
    await expect(args.onChange).toHaveBeenLastCalledWith('WebFetch');
    await expect(canvas.getByText('Allow all WebFetch calls')).toBeInTheDocument();
  },
};

export const ValidationFlow = {
  args: { onChange: fn() },
  render: (args: InputFlowArgs) => <FlowField args={args} />,
  play: async ({ args, canvasElement }: InputFlowContext) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('textbox', { name: 'Rule' });
    await userEvent.type(input, 'Bash(npm');
    await expect(canvas.queryByText('Close the parenthesis')).not.toBeInTheDocument();
    await userEvent.tab();
    await expect(await canvas.findByText('Close the parenthesis')).toBeInTheDocument();
    await userEvent.clear(input);
    await userEvent.type(input, 'Bsh(ls)');
    await expect(await canvas.findByText(/Unknown tool Bsh/)).toBeInTheDocument();
    await expect(args.onChange).toHaveBeenLastCalledWith('Bsh(ls)');
  },
};
