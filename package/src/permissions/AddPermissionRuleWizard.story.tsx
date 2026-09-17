import React, { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from '@storybook/test';
import { Button, Code, Stack } from '@mantine/core';
import {
  AddPermissionRuleWizard,
  type AddPermissionRuleWizardProps,
} from './AddPermissionRuleWizard';
import { PERMISSION_TOOLS_FIXTURE } from './fixtures';
import type { PermissionRule } from './types';

export default { title: 'permissions/AddPermissionRuleWizard' };

function Demo(props: Partial<AddPermissionRuleWizardProps>) {
  const [opened, setOpened] = useState(true);
  const [rule, setRule] = useState<PermissionRule | null>(null);
  return (
    <Stack p="xl" align="flex-start">
      <Button onClick={() => setOpened(true)}>Open wizard</Button>
      {rule && <Code block>{JSON.stringify(rule, null, 2)}</Code>}
      <AddPermissionRuleWizard
        opened={opened}
        onClose={() => setOpened(false)}
        onSubmit={async (next) => {
          await new Promise((resolve) => setTimeout(resolve, 400));
          setRule(next);
        }}
        knownTools={PERMISSION_TOOLS_FIXTURE}
        {...props}
      />
    </Stack>
  );
}

export function Usage() {
  return <Demo />;
}

export function FromDenial() {
  return (
    <Demo initialRule={{ behavior: 'allow', toolName: 'Bash', specifier: 'npm run build:*' }} />
  );
}

export function Edit() {
  return (
    <Demo
      initialRule={{
        id: 'allow-bash',
        behavior: 'allow',
        toolName: 'Bash',
        scope: 'user',
        source: '~/.agent/settings.json',
      }}
    />
  );
}

export function SaveError() {
  return (
    <Demo
      initialRule={{ behavior: 'deny', toolName: 'Read', specifier: '.env*' }}
      onSubmit={async () => {
        await new Promise((resolve) => setTimeout(resolve, 400));
        throw new Error('settings.json is read-only');
      }}
    />
  );
}

type WizardFlowArgs = {
  onSubmit: (rule: PermissionRule) => void;
  onClose: () => void;
};

function FlowWizard({ args }: { args: WizardFlowArgs }) {
  const [opened, setOpened] = useState(true);
  return (
    <Stack p="xl" align="flex-start">
      <Button onClick={() => setOpened(true)}>Open wizard</Button>
      <AddPermissionRuleWizard
        opened={opened}
        onClose={() => {
          args.onClose();
          setOpened(false);
        }}
        onSubmit={args.onSubmit}
        knownTools={PERMISSION_TOOLS_FIXTURE}
      />
    </Stack>
  );
}

const settle = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));

async function findOpenDialog(root: ReturnType<typeof within>, name?: string) {
  const element = await root.findByRole('dialog', name ? { name } : undefined);
  await waitFor(() => expect(getComputedStyle(element).opacity).toBe('1'));
  await settle();
  return within(element);
}

export const WizardFlow = {
  args: { onSubmit: fn(), onClose: fn() },
  render: (args: WizardFlowArgs) => <FlowWizard args={args} />,
  play: async ({ args, canvasElement }: { args: WizardFlowArgs; canvasElement: HTMLElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    const dialog = await findOpenDialog(page);
    await userEvent.click(await dialog.findByRole('radio', { name: /Allow/ }));
    await userEvent.click(dialog.getByRole('button', { name: 'Next' }));

    const input = await dialog.findByRole('textbox', { name: 'Rule' }, { timeout: 5000 });
    await userEvent.click(dialog.getByRole('button', { name: 'Bash(npm run test:*)' }));
    await expect(input).toHaveValue('Bash(npm run test:*)');
    await userEvent.clear(input);
    await userEvent.type(input, 'Bash');
    await userEvent.click(dialog.getByRole('button', { name: 'Next' }));
    await userEvent.click(await dialog.findByRole('button', { name: 'Next' }));

    await expect(await dialog.findByText(/allows every Bash call/)).toBeInTheDocument();
    await userEvent.click(dialog.getByRole('button', { name: 'Add rule' }));
    await waitFor(() =>
      expect(args.onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ behavior: 'allow', toolName: 'Bash', scope: 'local' })
      )
    );
    await waitFor(() => expect(args.onClose).toHaveBeenCalled());
  },
};
