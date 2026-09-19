import React, { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from '@storybook/test';
import { Box, Paper } from '@mantine/core';
import { NARROW_WIDTH, WIDE_WIDTH, WidthFrame } from '../_stories/WidthFrame';
import {
  PERMISSION_DENIALS_FIXTURE,
  PERMISSION_RULES_FIXTURE,
  PERMISSION_TOOLS_FIXTURE,
  WORKSPACE_DIRECTORIES_FIXTURE,
} from './fixtures';
import { PermissionRulesPanel, type PermissionRulesPanelProps } from './PermissionRulesPanel';
import type { PermissionRule, WorkspaceDirectory } from './types';

export default { title: 'Permissions & hooks/PermissionRulesPanel' };

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function Stateful(props: Partial<PermissionRulesPanelProps>) {
  const [rules, setRules] = useState<PermissionRule[]>(PERMISSION_RULES_FIXTURE);
  const [directories, setDirectories] = useState<WorkspaceDirectory[]>(
    WORKSPACE_DIRECTORIES_FIXTURE
  );
  return (
    <PermissionRulesPanel
      rules={rules}
      denials={PERMISSION_DENIALS_FIXTURE}
      directories={directories}
      knownTools={PERMISSION_TOOLS_FIXTURE}
      onSaveRule={async (rule, mode) => {
        await wait(400);
        setRules((prev) =>
          mode === 'edit'
            ? prev.map((item) => (item.id === rule.id ? rule : item))
            : [...prev, rule]
        );
      }}
      onDeleteRule={(rule) => setRules((prev) => prev.filter((item) => item.id !== rule.id))}
      onMoveRule={(rule, scope) =>
        setRules((prev) => prev.map((item) => (item.id === rule.id ? { ...item, scope } : item)))
      }
      onAddDirectory={async (directory) => {
        await wait(300);
        setDirectories((prev) => [...prev, directory]);
      }}
      onRemoveDirectory={(directory) =>
        setDirectories((prev) => prev.filter((item) => item.path !== directory.path))
      }
      {...props}
    />
  );
}

function Frame({ width, children }: { width: number; children: React.ReactNode }) {
  return (
    <WidthFrame width={width}>
      <Paper withBorder radius="md" p="md">
        {children}
      </Paper>
    </WidthFrame>
  );
}

export function Usage() {
  return (
    <Frame width={720}>
      <Stateful />
    </Frame>
  );
}

export function Narrow() {
  return (
    <Frame width={NARROW_WIDTH}>
      <Stateful />
    </Frame>
  );
}

export function Wide() {
  return (
    <Frame width={WIDE_WIDTH}>
      <Stateful />
    </Frame>
  );
}

export function FullScreen() {
  return (
    <Box p="xl" mih="100vh">
      <Stateful />
    </Box>
  );
}

export function RecentDenials() {
  return (
    <Frame width={720}>
      <Stateful defaultTab="denials" />
    </Frame>
  );
}

export function Workspace() {
  return (
    <Frame width={720}>
      <Stateful defaultTab="workspace" />
    </Frame>
  );
}

export function Loading() {
  return (
    <Frame width={720}>
      <PermissionRulesPanel rules={[]} loading />
    </Frame>
  );
}

export function Error() {
  return (
    <Frame width={720}>
      <PermissionRulesPanel
        rules={[]}
        error="Could not read .agent/settings.json"
        onRetry={() => {}}
      />
    </Frame>
  );
}

export function Empty() {
  return (
    <Frame width={720}>
      <PermissionRulesPanel
        rules={[]}
        denials={[]}
        directories={[]}
        onSaveRule={() => {}}
        onAddDirectory={() => {}}
      />
    </Frame>
  );
}

export function ReadOnly() {
  return (
    <Frame width={720}>
      <PermissionRulesPanel
        rules={PERMISSION_RULES_FIXTURE}
        denials={PERMISSION_DENIALS_FIXTURE}
        directories={WORKSPACE_DIRECTORIES_FIXTURE}
      />
    </Frame>
  );
}

type FlowArgs = {
  onSaveRule: (rule: PermissionRule, mode: 'create' | 'edit') => void;
  onDeleteRule: (rule: PermissionRule) => void;
  onMoveRule: (rule: PermissionRule, scope: PermissionRule['scope']) => void;
  onAddDirectory: (directory: WorkspaceDirectory) => void;
};

type FlowContext = { args: FlowArgs; canvasElement: HTMLElement };

const flowArgs = (): FlowArgs => ({
  onSaveRule: fn(),
  onDeleteRule: fn(),
  onMoveRule: fn(),
  onAddDirectory: fn(),
});

function FlowPanel({ args, ...props }: { args: FlowArgs } & Partial<PermissionRulesPanelProps>) {
  const [rules, setRules] = useState<PermissionRule[]>(PERMISSION_RULES_FIXTURE);
  const [directories, setDirectories] = useState<WorkspaceDirectory[]>(
    WORKSPACE_DIRECTORIES_FIXTURE
  );
  return (
    <Frame width={720}>
      <PermissionRulesPanel
        rules={rules}
        denials={PERMISSION_DENIALS_FIXTURE}
        directories={directories}
        knownTools={PERMISSION_TOOLS_FIXTURE}
        onSaveRule={(rule, mode) => {
          args.onSaveRule(rule, mode);
          setRules((prev) => [...prev, rule]);
        }}
        onDeleteRule={async (rule) => {
          args.onDeleteRule(rule);
          await wait(600);
          setRules((prev) => prev.filter((item) => item.id !== rule.id));
        }}
        onMoveRule={(rule, scope) => {
          args.onMoveRule(rule, scope);
          setRules((prev) => prev.map((item) => (item.id === rule.id ? { ...item, scope } : item)));
        }}
        onAddDirectory={(directory) => {
          args.onAddDirectory(directory);
          setDirectories((prev) => [...prev, directory]);
        }}
        {...props}
      />
    </Frame>
  );
}

const body = (canvasElement: HTMLElement) => within(canvasElement.ownerDocument.body);

const settle = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));

async function findOpenDialog(root: ReturnType<typeof within>, name?: string) {
  const element = await root.findByRole('dialog', name ? { name } : undefined);
  await waitFor(() => expect(getComputedStyle(element).opacity).toBe('1'));
  await settle();
  return within(element);
}

export const AddRuleFlow = {
  args: flowArgs(),
  render: (args: FlowArgs) => <FlowPanel args={args} />,
  play: async ({ args, canvasElement }: FlowContext) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Add rule' }));
    const dialog = await findOpenDialog(body(canvasElement));
    await userEvent.click(dialog.getByRole('button', { name: 'Next' }));
    await userEvent.type(await dialog.findByRole('textbox', { name: 'Rule' }), 'Bash(git status)');
    await expect(dialog.getByText('Allow the Bash command git status')).toBeInTheDocument();
    await userEvent.click(dialog.getByRole('button', { name: 'Next' }));
    await userEvent.click(await dialog.findByRole('radio', { name: /Project/ }));
    await userEvent.click(dialog.getByRole('button', { name: 'Next' }));
    await userEvent.click(await dialog.findByRole('button', { name: 'Add rule' }));
    await waitFor(() =>
      expect(args.onSaveRule).toHaveBeenCalledWith(
        expect.objectContaining({
          behavior: 'allow',
          toolName: 'Bash',
          specifier: 'git status',
          scope: 'project',
        }),
        'create'
      )
    );
    await expect(await canvas.findByText('Bash(git status)')).toBeInTheDocument();
  },
};

export const DeleteConfirmFlow = {
  args: flowArgs(),
  render: (args: FlowArgs) => <FlowPanel args={args} />,
  play: async ({ args, canvasElement }: FlowContext) => {
    const canvas = within(canvasElement);
    const page = body(canvasElement);
    await expect(canvas.getByText('WebFetch(domain:docs.git.example.com)')).toBeInTheDocument();
    await userEvent.click(canvas.getAllByRole('button', { name: 'Actions' })[0]);
    await userEvent.click(await page.findByRole('menuitem', { name: 'Delete' }));
    const dialog = await findOpenDialog(page, 'Delete rule');
    await expect(dialog.getByText('WebFetch(domain:docs.git.example.com)')).toBeInTheDocument();
    await expect(args.onDeleteRule).not.toHaveBeenCalled();
    await userEvent.click(dialog.getByRole('button', { name: 'Delete' }));
    await expect(await canvas.findByLabelText('Saving')).toBeInTheDocument();
    await expect(args.onDeleteRule).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'allow-docs' })
    );
    await waitFor(() =>
      expect(canvas.queryByText('WebFetch(domain:docs.git.example.com)')).not.toBeInTheDocument()
    );
  },
};

export const ChangeScopeFlow = {
  args: flowArgs(),
  render: (args: FlowArgs) => <FlowPanel args={args} />,
  play: async ({ args, canvasElement }: FlowContext) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getAllByRole('button', { name: 'Actions' })[0]);
    await userEvent.click(
      await body(canvasElement).findByRole('menuitem', { name: 'Move to Project' })
    );
    await expect(args.onMoveRule).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'allow-docs' }),
      'project'
    );
    await waitFor(() => expect(canvas.queryByText('Session')).not.toBeInTheDocument());
  },
};

export const WorkspacePathFlow = {
  args: flowArgs(),
  render: (args: FlowArgs) => <FlowPanel args={args} defaultTab="workspace" />,
  play: async ({ args, canvasElement }: FlowContext) => {
    const canvas = within(canvasElement);
    const input = canvas.getByLabelText('/absolute/path/to/directory');
    await userEvent.type(input, 'relative/path');
    await userEvent.click(canvas.getByRole('button', { name: 'Add' }));
    await expect(await canvas.findByText(/Use an absolute path/)).toBeInTheDocument();
    await expect(args.onAddDirectory).not.toHaveBeenCalled();
    await userEvent.clear(input);
    await userEvent.type(input, '/srv/data{enter}');
    await waitFor(() =>
      expect(args.onAddDirectory).toHaveBeenCalledWith({ path: '/srv/data', scope: 'local' })
    );
    await expect(await canvas.findByText('/srv/data')).toBeInTheDocument();
  },
};

export const DenialAllowFlow = {
  args: flowArgs(),
  render: (args: FlowArgs) => <FlowPanel args={args} defaultTab="denials" />,
  play: async ({ canvasElement }: FlowContext) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getAllByRole('button', { name: 'Allow this' })[0]);
    const dialog = await findOpenDialog(body(canvasElement));
    await expect(dialog.getByRole('radio', { name: /Allow/ })).toBeChecked();
    await userEvent.click(dialog.getByRole('button', { name: 'Next' }));
    await expect(await dialog.findByRole('textbox', { name: 'Rule' })).toHaveValue(
      'Bash(npm run build:*)'
    );
    await expect(
      dialog.getByText('Allow Bash commands starting with npm run build')
    ).toBeInTheDocument();
  },
};
