import React from 'react';
import { expect, userEvent, waitFor, within } from '@storybook/test';
import { Stack } from '@mantine/core';
import { NARROW_WIDTH, WIDE_WIDTH, WidthFrame } from '../_stories/WidthFrame';
import { HookActivity } from './HookActivity';

export default { title: 'HookActivity' };

function Demo() {
  return (
    <Stack gap="sm">
      <HookActivity event="PreToolUse" status="running" />
      <HookActivity
        event="PostToolUse"
        status="done"
        hooks={[
          { name: 'prettier --write', durationMs: 640 },
          { name: 'eslint --fix', durationMs: 2100 },
          { name: 'notify.sh', durationMs: 40 },
        ]}
      />
      <HookActivity
        event="PreToolUse"
        status="blocked"
        reason="Editing files under src/auth/keys is not allowed"
        hooks={[{ name: 'protect-keys.sh', durationMs: 80 }]}
      />
      <HookActivity
        event="Stop"
        status="error"
        reason="Hook exited with code 2"
        hooks={[
          { name: 'run-tests.sh', durationMs: 14_000, error: '3 tests failed in refresh.test.ts' },
        ]}
      />
    </Stack>
  );
}

export function Usage() {
  return (
    <Stack p="xl" maw={520}>
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

export function BlockedFlow() {
  return (
    <Stack p="xl" maw={520}>
      <HookActivity
        event="PreToolUse"
        status="blocked"
        reason="rm -rf is not allowed"
        hooks={[{ name: 'guard.sh', durationMs: 1200, error: 'denied' }]}
      />
    </Stack>
  );
}

BlockedFlow.play = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
  const canvas = within(canvasElement);
  const toggle = canvas.getByRole('button', { name: /Blocked by PreToolUse hook/ });
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(canvas.getByText('rm -rf is not allowed')).toBeVisible();
  await expect(canvas.getByText('denied')).toBeVisible();
  await userEvent.click(toggle);
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await waitFor(() => expect(canvas.getByText('denied')).not.toBeVisible());
};

export function DoneFlow() {
  return (
    <Stack p="xl" maw={520}>
      <HookActivity
        event="PostToolUse"
        status="done"
        hooks={[
          { name: 'prettier --write', durationMs: 640 },
          { name: 'eslint --fix', durationMs: 2100 },
        ]}
      />
    </Stack>
  );
}

DoneFlow.play = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
  const canvas = within(canvasElement);
  const toggle = canvas.getByRole('button', { name: /Ran 2 PostToolUse hooks/ });
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await userEvent.click(toggle);
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await waitFor(() => expect(canvas.getByText('eslint --fix')).toBeVisible());
  await expect(canvas.getByText('2s')).toBeVisible();
};
