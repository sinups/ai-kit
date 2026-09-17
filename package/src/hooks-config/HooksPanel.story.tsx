import React, { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from '@storybook/test';
import { Box, Paper, ScrollArea } from '@mantine/core';
import { NARROW_WIDTH, WIDE_WIDTH, WidthFrame } from '../_stories/WidthFrame';
import { HOOK_TOOLS, HOOKS_FIXTURE } from './fixtures';
import { HooksPanel, type HooksPanelProps } from './HooksPanel';
import type { HookConfig } from './types';

export default { title: 'hooks-config/HooksPanel' };

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function StatefulPanel(props: Partial<HooksPanelProps>) {
  const [hooks, setHooks] = useState<HookConfig[]>(HOOKS_FIXTURE);
  return (
    <HooksPanel
      hooks={hooks}
      knownTools={HOOK_TOOLS}
      onSave={async (hook, mode) => {
        await wait(400);
        setHooks((prev) =>
          mode === 'edit'
            ? prev.map((item) => (item.id === hook.id ? hook : item))
            : [...prev, hook]
        );
      }}
      onDelete={(hook) => setHooks((prev) => prev.filter((item) => item.id !== hook.id))}
      onToggle={(hook, enabled) =>
        setHooks((prev) => prev.map((item) => (item.id === hook.id ? { ...item, enabled } : item)))
      }
      {...props}
    />
  );
}

export function Usage() {
  return (
    <Box p="xl" maw={720}>
      <StatefulPanel />
    </Box>
  );
}

export function Narrow() {
  return (
    <WidthFrame width={NARROW_WIDTH}>
      <StatefulPanel />
    </WidthFrame>
  );
}

export function Wide() {
  return (
    <WidthFrame width={WIDE_WIDTH}>
      <StatefulPanel />
    </WidthFrame>
  );
}

export function FullScreen() {
  return (
    <Paper h="100vh" radius={0}>
      <ScrollArea h="100%">
        <Box p="lg" maw={960} mx="auto">
          <StatefulPanel />
        </Box>
      </ScrollArea>
    </Paper>
  );
}

export function Loading() {
  return (
    <WidthFrame width={WIDE_WIDTH}>
      <HooksPanel hooks={[]} loading />
    </WidthFrame>
  );
}

export function ErrorState() {
  return (
    <WidthFrame width={WIDE_WIDTH}>
      <HooksPanel
        hooks={[]}
        error="Could not read .agent/settings.json: unexpected token at line 12"
        onRetry={() => {}}
      />
    </WidthFrame>
  );
}

export function Empty() {
  return (
    <WidthFrame width={NARROW_WIDTH}>
      <StatefulPanel hooks={[]} />
    </WidthFrame>
  );
}

export function ReadOnly() {
  return (
    <WidthFrame width={WIDE_WIDTH}>
      <HooksPanel
        hooks={HOOKS_FIXTURE}
        labels={{ description: 'Managed by your organization and cannot be changed here.' }}
      />
    </WidthFrame>
  );
}

type FlowArgs = {
  onSave: (hook: HookConfig, mode: 'create' | 'edit') => void;
  onDelete: (hook: HookConfig) => void;
  onToggle: (hook: HookConfig, enabled: boolean) => void;
  onRetry: () => void;
};

type FlowContext = { canvasElement: HTMLElement; args: FlowArgs };

function FlowPanel({ args, initialHooks }: { args: FlowArgs; initialHooks: HookConfig[] }) {
  const [hooks, setHooks] = useState<HookConfig[]>(initialHooks);
  return (
    <HooksPanel
      hooks={hooks}
      knownTools={HOOK_TOOLS}
      onSave={async (hook, mode) => {
        args.onSave(hook, mode);
        await wait(300);
        setHooks((prev) =>
          mode === 'edit'
            ? prev.map((item) => (item.id === hook.id ? hook : item))
            : [...prev, hook]
        );
      }}
      onDelete={async (hook) => {
        args.onDelete(hook);
        await wait(300);
        setHooks((prev) => prev.filter((item) => item.id !== hook.id));
      }}
      onToggle={async (hook, enabled) => {
        args.onToggle(hook, enabled);
        await wait(600);
        setHooks((prev) => prev.map((item) => (item.id === hook.id ? { ...item, enabled } : item)));
      }}
    />
  );
}

const flowArgs = () => ({ onSave: fn(), onDelete: fn(), onToggle: fn(), onRetry: fn() });

const bodyOf = (canvasElement: HTMLElement) => within(canvasElement.ownerDocument.body);

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

export const ToggleFlow = {
  args: flowArgs(),
  render: (args: FlowArgs) => (
    <WidthFrame width={WIDE_WIDTH}>
      <FlowPanel args={args} initialHooks={[HOOKS_FIXTURE[1]]} />
    </WidthFrame>
  ),
  play: async ({ canvasElement, args }: FlowContext) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole('switch', { name: /^Enabled/ });
    await expect(toggle).toBeChecked();
    await userEvent.click(toggle);
    await expect(args.onToggle).toHaveBeenCalledWith(HOOKS_FIXTURE[1], false);
    await waitFor(() => expect(canvas.getByRole('switch', { name: /^Enabled/ })).toBeDisabled());
    await expect(canvas.getByLabelText('Saving')).toBeInTheDocument();
    await waitFor(() =>
      expect(canvas.getByRole('switch', { name: /^Enabled/ })).not.toBeDisabled()
    );
    await expect(canvas.getByRole('switch', { name: /^Enabled/ })).not.toBeChecked();
  },
};

export const DeleteConfirmFlow = {
  args: flowArgs(),
  render: (args: FlowArgs) => (
    <WidthFrame width={WIDE_WIDTH}>
      <FlowPanel args={args} initialHooks={[HOOKS_FIXTURE[1], HOOKS_FIXTURE[3]]} />
    </WidthFrame>
  ),
  play: async ({ canvasElement, args }: FlowContext) => {
    const canvas = within(canvasElement);
    const body = bodyOf(canvasElement);
    await userEvent.click(canvas.getAllByRole('button', { name: 'Actions' })[0]);
    await userEvent.click(await body.findByRole('menuitem', { name: 'Delete' }));
    const dialog = within(await body.findByRole('dialog', { name: 'Delete hook' }));
    await expect(dialog.getByText(/will no longer run on/)).toBeInTheDocument();
    await expect(args.onDelete).not.toHaveBeenCalled();
    await userEvent.click(await dialog.findByRole('button', { name: 'Delete' }));
    await expect(args.onDelete).toHaveBeenCalledWith(HOOKS_FIXTURE[1]);
    await waitFor(() => expect(body.queryByRole('dialog', { name: 'Delete hook' })).toBeNull());
    await waitFor(() =>
      expect(canvas.getAllByRole('switch', { name: /^Enabled/ })).toHaveLength(1)
    );
  },
};

export const AddHookFlow = {
  args: flowArgs(),
  render: (args: FlowArgs) => (
    <WidthFrame width={WIDE_WIDTH}>
      <FlowPanel args={args} initialHooks={[HOOKS_FIXTURE[3]]} />
    </WidthFrame>
  ),
  play: async ({ canvasElement, args }: FlowContext) => {
    const canvas = within(canvasElement);
    const body = bodyOf(canvasElement);
    await userEvent.click(canvas.getAllByRole('button', { name: 'Add hook' })[0]);
    const dialogElement = await body.findByRole('dialog');
    await waitFor(() =>
      expect(dialogElement.querySelector('[data-layout="vertical"]')).not.toBeNull()
    );
    const dialog = within(dialogElement);
    const next = () => clickNext(dialogElement);

    const radio = await dialog.findByRole('radio', { name: /Before tool use/ });
    await userEvent.click(radio);
    await waitFor(() => expect(radio).toBeChecked());
    await next();
    await userEvent.type(await dialog.findByRole('combobox', { name: 'Tool matcher' }), 'Bas');
    await userEvent.click(await body.findByRole('option', { name: 'Bash' }));
    await expect(await dialog.findByRole('combobox', { name: 'Tool matcher' })).toHaveValue('Bash');
    await next();
    await userEvent.type(await dialog.findByRole('textbox', { name: 'Command' }), './check.sh');
    await userEvent.type(await dialog.findByRole('textbox', { name: 'Timeout' }), '30');
    await next();
    await userEvent.click(await dialog.findByRole('radio', { name: /Local/ }));
    await next();
    await expect(await dialog.findByText(/"tool_name": "Bash"/)).toBeInTheDocument();
    await userEvent.click(await dialog.findByRole('button', { name: 'Add hook' }));

    await expect(args.onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'PreToolUse',
        matcher: 'Bash',
        type: 'command',
        command: './check.sh',
        timeout: 30,
        scope: 'local',
      }),
      'create'
    );
    await waitFor(() => expect(body.queryByRole('dialog')).toBeNull());
    await expect(await canvas.findByText('./check.sh')).toBeInTheDocument();
  },
};

export const EditHookFlow = {
  args: flowArgs(),
  render: (args: FlowArgs) => (
    <WidthFrame width={WIDE_WIDTH}>
      <FlowPanel args={args} initialHooks={[HOOKS_FIXTURE[4]]} />
    </WidthFrame>
  ),
  play: async ({ canvasElement, args }: FlowContext) => {
    const canvas = within(canvasElement);
    const body = bodyOf(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Actions' }));
    await userEvent.click(await body.findByRole('menuitem', { name: 'Edit' }));
    const dialogElement = await body.findByRole('dialog');
    await waitFor(() =>
      expect(dialogElement.querySelector('[data-layout="vertical"]')).not.toBeNull()
    );
    const dialog = within(dialogElement);
    await expect(await dialog.findByText('Edit hook')).toBeInTheDocument();
    await expect(await dialog.findByRole('radio', { name: /Session started/ })).toBeChecked();
    for (let step = 0; step < 3; step++) {
      await clickNext(dialogElement);
    }
    await userEvent.click(await dialog.findByRole('button', { name: 'Save hook' }));
    await expect(args.onSave).toHaveBeenCalledWith(
      expect.objectContaining({ id: HOOKS_FIXTURE[4].id, event: 'SessionStart' }),
      'edit'
    );
    await waitFor(() => expect(body.queryByRole('dialog')).toBeNull());
  },
};

export const ErrorRetryFlow = {
  args: flowArgs(),
  render: (args: FlowArgs) => (
    <WidthFrame width={WIDE_WIDTH}>
      <HooksPanel hooks={[]} error="Could not read .agent/settings.json" onRetry={args.onRetry} />
    </WidthFrame>
  ),
  play: async ({ canvasElement, args }: FlowContext) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Could not read .agent/settings.json')).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: 'Retry' }));
    await expect(args.onRetry).toHaveBeenCalledTimes(1);
  },
};
