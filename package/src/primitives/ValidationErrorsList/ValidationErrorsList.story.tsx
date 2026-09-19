import React, { useState } from 'react';
import { Button, Stack, Text } from '@mantine/core';
import { expect, fn, userEvent, waitFor, within } from '@storybook/test';
import { NARROW_WIDTH, WIDE_WIDTH, WidthFrame } from '../../_stories/WidthFrame';
import { InvalidSettingsNotice } from './InvalidSettingsNotice';
import type { SettingsValidationError } from './validation-errors';
import { ValidationErrorsList } from './ValidationErrorsList';

export default { title: 'Primitives/ValidationErrorsList' };

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const ERRORS: SettingsValidationError[] = [
  {
    file: '.agent/settings.json',
    path: 'permissions.allow[2]',
    message: 'Unknown tool "Bsh"',
    suggestion: 'Did you mean "Bash"?',
    docsUrl: 'https://docs.example.com/agent-cli/settings#permission-settings',
  },
  {
    file: '.agent/settings.json',
    path: 'hooks.PostToolUse[0].hooks',
    message: 'Expected an array, received an object',
    docsUrl: 'https://docs.example.com/agent-cli/hooks',
  },
  { file: '.agent/settings.json', path: 'permissions.allow[2]', message: 'Unknown tool "Bsh"' },
  { file: '.agent/settings.json', path: 'env.NODE_OPTIONS', message: 'Must be a string' },
  {
    file: '~/.agent/settings.json',
    path: 'model',
    message: 'Unknown model "qwen-2.5-coder-99b"',
    suggestion: 'Use one of qwen-2.5-coder-32b, llama-3.3-70b, mistral-small-24b',
    severity: 'warning',
  },
  {
    file: '~/.agent/settings.json',
    path: 'outputStyle',
    message: 'Unknown field, it is ignored',
    severity: 'warning',
  },
  {
    file: '/Users/me/projects/app/packages/billing/.agent/settings.local.json',
    message: 'Unexpected token } in JSON at line 14, column 3',
  },
];

function Log({ value }: { value: string }) {
  return value ? (
    <Text size="xs" c="dimmed">
      {value}
    </Text>
  ) : null;
}

function ListDemo(props: { maxItems?: number }) {
  const [log, setLog] = useState('');
  return (
    <Stack gap="sm">
      <ValidationErrorsList
        errors={ERRORS}
        onOpenFile={(file) => setLog(`Open ${file}`)}
        {...props}
      />
      <Log value={log} />
    </Stack>
  );
}

function NoticeDemo() {
  const [log, setLog] = useState('');
  return (
    <Stack gap="sm">
      <InvalidSettingsNotice
        file=".agent/settings.json"
        errors={ERRORS.filter((error) => error.file === '.agent/settings.json')}
        onOpenFile={(file) => setLog(`Open ${file}`)}
        onContinueWithout={async () => {
          await wait(700);
          setLog('Continuing without the file');
        }}
      />
      <Log value={log} />
    </Stack>
  );
}

export function Usage() {
  return (
    <Stack p="xl" maw={720} gap="xl">
      <NoticeDemo />
      <ListDemo />
    </Stack>
  );
}

export function Narrow() {
  return (
    <WidthFrame width={NARROW_WIDTH}>
      <Stack gap="lg">
        <NoticeDemo />
        <ListDemo maxItems={2} />
      </Stack>
    </WidthFrame>
  );
}

export function Wide() {
  return (
    <WidthFrame width={WIDE_WIDTH}>
      <Stack gap="lg">
        <NoticeDemo />
        <ListDemo />
      </Stack>
    </WidthFrame>
  );
}

export function Collapsed() {
  return (
    <WidthFrame width={WIDE_WIDTH}>
      <ListDemo maxItems={1} />
    </WidthFrame>
  );
}

export function Warning() {
  return (
    <WidthFrame width={WIDE_WIDTH}>
      <InvalidSettingsNotice
        file="~/.agent/settings.json"
        errors={ERRORS.filter((error) => error.severity === 'warning')}
        defaultExpanded
        onOpenFile={() => {}}
        onDismiss={() => {}}
      />
    </WidthFrame>
  );
}

export function RejectedContinue() {
  return (
    <WidthFrame width={NARROW_WIDTH}>
      <InvalidSettingsNotice
        file=".agent/settings.local.json"
        count={1}
        onOpenFile={() => {}}
        onContinueWithout={async () => {
          await wait(600);
          throw new Error('The session could not be restarted without this file');
        }}
      />
    </WidthFrame>
  );
}

export function Empty() {
  const [errors, setErrors] = useState<SettingsValidationError[]>(ERRORS.slice(0, 2));
  return (
    <WidthFrame width={NARROW_WIDTH}>
      <Stack gap="sm">
        <ValidationErrorsList errors={errors} emptyLabel="All settings files are valid" />
        <Button size="xs" variant="default" onClick={() => setErrors([])}>
          Fix all
        </Button>
      </Stack>
    </WidthFrame>
  );
}

type OpenFileArgs = { onOpenFile: (file: string) => void };

export const ShowMoreFlow = {
  render: () => (
    <WidthFrame width={WIDE_WIDTH}>
      <ValidationErrorsList errors={ERRORS} maxItems={1} />
    </WidthFrame>
  ),
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement);
    const project = canvas.getByRole('region', { name: '.agent/settings.json' });
    await expect(within(project).queryByText('Must be a string')).not.toBeInTheDocument();
    await userEvent.click(within(project).getByRole('button', { name: 'Show 2 more' }));
    await expect(await within(project).findByText('Must be a string')).toBeInTheDocument();
    await expect(
      within(project).getByText('Expected an array, received an object')
    ).toBeInTheDocument();
    await userEvent.click(within(project).getByRole('button', { name: 'Show less' }));
    await waitFor(() =>
      expect(within(project).queryByText('Must be a string')).not.toBeInTheDocument()
    );
  },
};

export const OpenFileFlow = {
  args: { onOpenFile: fn() },
  render: (args: OpenFileArgs) => (
    <WidthFrame width={WIDE_WIDTH}>
      <ValidationErrorsList errors={ERRORS} onOpenFile={args.onOpenFile} />
    </WidthFrame>
  ),
  play: async ({ canvasElement, args }: { canvasElement: HTMLElement; args: OpenFileArgs }) => {
    const canvas = within(canvasElement);
    const user = canvas.getByRole('region', { name: '~/.agent/settings.json' });
    await expect(within(user).getByText('Unknown model "qwen-2.5-coder-99b"')).toBeInTheDocument();
    await userEvent.click(within(user).getByRole('button', { name: 'Open file' }));
    await expect(args.onOpenFile).toHaveBeenCalledTimes(1);
    await expect(args.onOpenFile).toHaveBeenCalledWith('~/.agent/settings.json');
  },
};
