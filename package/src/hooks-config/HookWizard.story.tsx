import React, { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from '@storybook/test';
import { Button, Code, Stack } from '@mantine/core';
import { HOOK_TOOLS, HOOKS_FIXTURE } from './fixtures';
import { HookWizard, type HookWizardProps } from './HookWizard';
import type { HookConfig } from './types';

export default { title: 'Permissions & hooks/HookWizard' };

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function Demo(props: Partial<HookWizardProps>) {
  const [opened, setOpened] = useState(true);
  const [result, setResult] = useState<HookConfig | null>(null);
  return (
    <Stack p="xl" align="flex-start">
      <Button onClick={() => setOpened(true)}>Open wizard</Button>
      {result && <Code block>{JSON.stringify(result, null, 2)}</Code>}
      <HookWizard
        opened={opened}
        onClose={() => setOpened(false)}
        knownTools={HOOK_TOOLS}
        {...props}
        onSubmit={async (hook) => {
          await (props.onSubmit ? props.onSubmit(hook) : wait(400));
          setResult(hook);
        }}
      />
    </Stack>
  );
}

export function Usage() {
  return <Demo />;
}

export function Edit() {
  return <Demo initialHook={HOOKS_FIXTURE[0]} />;
}

export function EditPrompt() {
  return <Demo initialHook={HOOKS_FIXTURE[2]} />;
}

export function SaveError() {
  return (
    <Demo
      initialHook={HOOKS_FIXTURE[5]}
      onSubmit={async () => {
        await wait(400);
        throw new Error('.agent/settings.json is read-only');
      }}
    />
  );
}

type WizardFlowContext = {
  canvasElement: HTMLElement;
  args: { onSubmit: (hook: HookConfig) => void };
};

function FlowDemo({ onSubmit }: { onSubmit: (hook: HookConfig) => void }) {
  return (
    <Demo
      createId={() => 'flow-hook'}
      onSubmit={async (hook) => {
        onSubmit(hook);
        await wait(200);
      }}
    />
  );
}

async function clickNext(dialogElement: HTMLElement, expectStepChange = true) {
  await waitFor(() =>
    expect(dialogElement.querySelector('[data-layout="vertical"]')).not.toBeNull()
  );
  const step = dialogElement.querySelector('[data-step]')?.getAttribute('data-step');
  await userEvent.click(within(dialogElement).getByRole('button', { name: 'Next' }));
  if (expectStepChange) {
    await waitFor(() =>
      expect(dialogElement.querySelector('[data-step]')?.getAttribute('data-step')).not.toBe(step)
    );
  }
}

async function openDialog(canvasElement: HTMLElement) {
  const body = within(canvasElement.ownerDocument.body);
  const dialogElement = await body.findByRole('dialog');
  await waitFor(() =>
    expect(dialogElement.querySelector('[data-layout="vertical"]')).not.toBeNull()
  );
  return {
    body,
    dialog: within(dialogElement),
    next: (expectStepChange = true) => clickNext(dialogElement, expectStepChange),
  };
}

export const ValidationFlow = {
  args: { onSubmit: fn() },
  render: (args: WizardFlowContext['args']) => <FlowDemo onSubmit={args.onSubmit} />,
  play: async ({ canvasElement, args }: WizardFlowContext) => {
    const { dialog, next } = await openDialog(canvasElement);
    await next(false);
    await expect(await dialog.findByText('Choose an event')).toBeInTheDocument();

    const radio = await dialog.findByRole('radio', { name: /Before tool use/ });
    await userEvent.click(radio);
    await waitFor(() => expect(radio).toBeChecked());
    await next();
    const matcher = await dialog.findByRole('combobox', { name: 'Tool matcher' });
    await userEvent.type(matcher, 'Edit(');
    await next(false);
    await expect(await dialog.findByText('Not a valid regular expression')).toBeInTheDocument();
    await userEvent.clear(matcher);
    await userEvent.type(matcher, 'Edit|Write');
    await waitFor(() => expect(dialog.queryByText('Not a valid regular expression')).toBeNull());
    await next();

    await next(false);
    await expect(await dialog.findByText('Enter a command')).toBeInTheDocument();
    await expect(args.onSubmit).not.toHaveBeenCalled();
  },
};

export const EventWithoutMatcherFlow = {
  args: { onSubmit: fn() },
  render: (args: WizardFlowContext['args']) => <FlowDemo onSubmit={args.onSubmit} />,
  play: async ({ canvasElement, args }: WizardFlowContext) => {
    const { body, dialog, next } = await openDialog(canvasElement);
    const radio = await dialog.findByRole('radio', { name: /Agent stopped/ });
    await userEvent.click(radio);
    await waitFor(() => expect(radio).toBeChecked());
    await next();
    await expect(dialog.queryByRole('combobox', { name: 'Tool matcher' })).toBeNull();
    await userEvent.type(await dialog.findByRole('textbox', { name: 'Command' }), 'npm test');
    await next();
    await next();
    await userEvent.click(await dialog.findByRole('button', { name: 'Add hook' }));

    await expect(args.onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'flow-hook', event: 'Stop', command: 'npm test' })
    );
    await expect(args.onSubmit).toHaveBeenCalledWith(
      expect.not.objectContaining({ matcher: expect.anything() })
    );
    await waitFor(() => expect(body.queryByRole('dialog')).toBeNull());
    await expect(await within(canvasElement).findByText(/"event": "Stop"/)).toBeInTheDocument();
  },
};
