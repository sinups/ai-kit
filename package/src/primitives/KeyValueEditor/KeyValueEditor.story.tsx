import React, { useState } from 'react';
import { Code, Stack, Text } from '@mantine/core';
import { expect, fn, userEvent, waitFor, within } from '@storybook/test';
import { NARROW_WIDTH, WIDE_WIDTH, WidthFrame } from '../../_stories/WidthFrame';
import { headerKeyValidator, type KeyValuePair } from './key-value';
import { KeyValueEditor, type KeyValueEditorProps } from './KeyValueEditor';

export default { title: 'Primitives/KeyValueEditor' };

const ENV: KeyValuePair[] = [
  { id: 'env-1', key: 'DATABASE_URL', value: 'postgres://localhost:5432/app' },
  { id: 'env-2', key: 'LLM_API_KEY', value: 'sk-live-123', secret: true },
  { id: 'env-3', key: 'LOG_LEVEL', value: 'debug' },
];

function Demo({
  initial = ENV,
  ...props
}: Partial<KeyValueEditorProps> & { initial?: KeyValuePair[] }) {
  const [pairs, setPairs] = useState(initial);
  return (
    <Stack gap="md">
      <KeyValueEditor
        value={pairs}
        onChange={setPairs}
        keyPlaceholder="Name"
        addLabel="Add variable"
        allowSecrets
        {...props}
      />
      <Code block>{JSON.stringify(pairs, null, 2)}</Code>
    </Stack>
  );
}

export function Usage() {
  return (
    <Stack p="xl" maw={640} gap="xs">
      <Text size="sm" c="dimmed">
        Paste `KEY=value` lines into any key field to add several rows at once
      </Text>
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

export function Headers() {
  return (
    <WidthFrame width={WIDE_WIDTH}>
      <Demo
        initial={[
          { id: 'h-1', key: 'Authorization', value: 'Bearer token', secret: true },
          { id: 'h-2', key: 'X Trace', value: '1' },
        ]}
        keyPlaceholder="Header"
        addLabel="Add header"
        validateKey={headerKeyValidator}
      />
    </WidthFrame>
  );
}

export function Errors() {
  return (
    <WidthFrame width={WIDE_WIDTH}>
      <Demo
        initial={[
          { id: 'e-1', key: 'TOKEN', value: '1' },
          { id: 'e-2', key: 'TOKEN', value: '2' },
          { id: 'e-3', key: '', value: 'orphan' },
          { id: 'e-4', key: '9LIVES', value: '' },
        ]}
      />
    </WidthFrame>
  );
}

export function Empty() {
  return (
    <WidthFrame width={NARROW_WIDTH}>
      <Demo initial={[]} maxRows={3} />
    </WidthFrame>
  );
}

export function Disabled() {
  return (
    <WidthFrame width={WIDE_WIDTH}>
      <Demo disabled />
    </WidthFrame>
  );
}

type FlowArgs = { onChange: (pairs: KeyValuePair[]) => void };

function FlowDemo({ initial, onChange }: { initial: KeyValuePair[] } & FlowArgs) {
  const [pairs, setPairs] = useState(initial);
  return (
    <WidthFrame width={WIDE_WIDTH}>
      <KeyValueEditor
        value={pairs}
        onChange={(next) => {
          setPairs(next);
          onChange(next);
        }}
        allowSecrets
      />
    </WidthFrame>
  );
}

export const PasteEnvFlow = {
  args: { onChange: fn() },
  render: (args: FlowArgs) => <FlowDemo initial={[{ id: 'p-1', key: '', value: '' }]} {...args} />,
  play: async ({ canvasElement, args }: { canvasElement: HTMLElement; args: FlowArgs }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('textbox', { name: 'Key 1' }));
    await userEvent.paste('# local\nHOST=localhost\nPORT=5432');
    await waitFor(() => expect(canvas.getByRole('textbox', { name: 'Key 1' })).toHaveValue('HOST'));
    await expect(canvas.getByRole('textbox', { name: 'Key 2' })).toHaveValue('PORT');
    await expect(canvas.getByRole('textbox', { name: 'Value 2' })).toHaveValue('5432');
    await expect(args.onChange).toHaveBeenCalledTimes(1);
    await expect(args.onChange).toHaveBeenCalledWith([
      expect.objectContaining({ key: 'HOST', value: 'localhost' }),
      expect.objectContaining({ key: 'PORT', value: '5432' }),
    ]);
  },
};

export const ValidationFlow = {
  args: { onChange: fn() },
  render: (args: FlowArgs) => (
    <FlowDemo initial={[{ id: 'v-1', key: 'TOKEN', value: '1' }]} {...args} />
  ),
  play: async ({ canvasElement, args }: { canvasElement: HTMLElement; args: FlowArgs }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Add' }));
    const key = canvas.getByRole('textbox', { name: 'Key 2' });
    await userEvent.type(canvas.getByRole('textbox', { name: 'Value 2' }), 'orphan');
    await expect(await canvas.findByText('Key is required')).toBeInTheDocument();
    await userEvent.type(key, 'TOKEN');
    await expect(await canvas.findByText('Duplicate key')).toBeInTheDocument();
    await expect(key).toHaveAttribute('aria-invalid', 'true');
    await expect(args.onChange).toHaveBeenLastCalledWith([
      expect.objectContaining({ key: 'TOKEN', value: '1' }),
      expect.objectContaining({ key: 'TOKEN', value: 'orphan' }),
    ]);
  },
};

export const SecretFlow = {
  args: { onChange: fn() },
  render: (args: FlowArgs) => (
    <FlowDemo initial={[{ id: 's-1', key: 'API_KEY', value: 'sk-live-123' }]} {...args} />
  ),
  play: async ({ canvasElement, args }: { canvasElement: HTMLElement; args: FlowArgs }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByLabelText('Value 1')).not.toHaveAttribute('type', 'password');
    await userEvent.click(canvas.getByRole('button', { name: 'Mark as secret' }));
    await waitFor(() =>
      expect(canvas.getByLabelText('Value 1')).toHaveAttribute('type', 'password')
    );
    await expect(args.onChange).toHaveBeenLastCalledWith([
      expect.objectContaining({ key: 'API_KEY', secret: true }),
    ]);
    await userEvent.click(canvas.getByRole('button', { name: 'Mark as not secret' }));
    await waitFor(() =>
      expect(canvas.getByLabelText('Value 1')).not.toHaveAttribute('type', 'password')
    );
    const calls = (args.onChange as ReturnType<typeof fn>).mock.calls;
    await expect(calls[calls.length - 1][0][0].secret).toBeFalsy();
  },
};
