import React, { useState } from 'react';
import { Button, Code, Stack, Text } from '@mantine/core';
import { expect, fn, userEvent, waitFor, within } from '@storybook/test';
import { ConfirmDialog, type ConfirmDialogProps } from './ConfirmDialog';

export default { title: 'Primitives/ConfirmDialog' };

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function Demo(props: Partial<ConfirmDialogProps>) {
  const [opened, setOpened] = useState(true);
  const [result, setResult] = useState('');
  return (
    <Stack p="xl" align="flex-start">
      <Button onClick={() => setOpened(true)}>Open dialog</Button>
      {result && <Text size="sm">{result}</Text>}
      <ConfirmDialog
        opened={opened}
        onClose={() => setOpened(false)}
        title="Delete rule"
        message={
          <>
            <Code>Bash(npm run test:*)</Code> will be removed from the project settings.
          </>
        }
        labels={{ confirm: 'Delete' }}
        danger
        onConfirm={async () => {
          await wait(600);
          setResult('Deleted');
        }}
        {...props}
      />
    </Stack>
  );
}

export function Usage() {
  return <Demo />;
}

export function Neutral() {
  return (
    <Demo
      danger={false}
      title="Move rule"
      message="The rule will be stored in your user settings."
      labels={{ confirm: 'Move' }}
    />
  );
}

export function RejectedAction() {
  return (
    <Demo
      onConfirm={async () => {
        await wait(600);
        throw new Error('settings.json is read-only');
      }}
    />
  );
}

type FlowArgs = { onConfirm: () => Promise<void>; onClose: () => void };

function FlowDialog(args: FlowArgs) {
  return (
    <ConfirmDialog
      opened
      danger
      title="Delete rule"
      message="Bash(npm run test:*) will be removed from the project settings."
      labels={{ confirm: 'Delete' }}
      onConfirm={args.onConfirm}
      onClose={args.onClose}
    />
  );
}

type FlowContext = { canvasElement: HTMLElement; args: FlowArgs };

export const PendingFlow = {
  args: {
    onConfirm: fn(async () => {
      await wait(500);
    }),
    onClose: fn(),
  },
  render: (args: FlowArgs) => <FlowDialog {...args} />,
  play: async ({ canvasElement, args }: FlowContext) => {
    const page = within(canvasElement.ownerDocument.body);
    const dialog = within(await page.findByRole('dialog', { name: 'Delete rule' }));
    const confirm = dialog.getByRole('button', { name: 'Delete' });
    await userEvent.click(confirm);
    await waitFor(() => expect(confirm).toHaveAttribute('data-loading', 'true'));
    await expect(dialog.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    await expect(args.onConfirm).toHaveBeenCalledTimes(1);
    await expect(args.onClose).not.toHaveBeenCalled();
    await waitFor(() => expect(args.onClose).toHaveBeenCalledTimes(1), { timeout: 3000 });
    await expect(confirm).not.toHaveAttribute('data-loading');
  },
};

export const ErrorFlow = {
  args: {
    onConfirm: fn(async () => {
      await wait(300);
      throw new Error('settings.json is read-only');
    }),
    onClose: fn(),
  },
  render: (args: FlowArgs) => <FlowDialog {...args} />,
  play: async ({ canvasElement, args }: FlowContext) => {
    const page = within(canvasElement.ownerDocument.body);
    const dialog = within(await page.findByRole('dialog', { name: 'Delete rule' }));
    await userEvent.click(dialog.getByRole('button', { name: 'Delete' }));
    await expect(
      await dialog.findByText('settings.json is read-only', {}, { timeout: 3000 })
    ).toBeInTheDocument();
    await expect(args.onConfirm).toHaveBeenCalledTimes(1);
    await expect(args.onClose).not.toHaveBeenCalled();
    await expect(dialog.getByRole('button', { name: 'Delete' })).toBeEnabled();

    await userEvent.click(dialog.getByRole('button', { name: 'Cancel' }));
    await expect(args.onClose).toHaveBeenCalledTimes(1);
  },
};
