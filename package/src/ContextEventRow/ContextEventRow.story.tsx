import React from 'react';
import { expect, userEvent, waitFor, within } from '@storybook/test';
import { Stack } from '@mantine/core';
import { NARROW_WIDTH, WIDE_WIDTH, WidthFrame } from '../_stories/WidthFrame';
import { ContextEventRow } from './ContextEventRow';

export default { title: 'ContextEventRow' };

function Demo() {
  return (
    <Stack gap="sm">
      <ContextEventRow kind="file" label="src/auth/session.ts" detail="182 lines" />
      <ContextEventRow
        kind="directory"
        label="src/auth"
        detail="4 files"
        items={['session.ts', 'client.ts', 'refresh.ts', 'refresh.test.ts']}
      />
      <ContextEventRow kind="memory" label="AGENTS.md" detail="2.4k tokens" />
      <ContextEventRow kind="mcp-resource" label="git://acme/web/issues/412" />
      <ContextEventRow kind="skill" label="testing-patterns" />
      <ContextEventRow
        kind="diagnostics"
        label="refresh.test.ts"
        detail="2 errors"
        items={[
          "TS2345: Argument of type 'string | undefined'",
          'TS7006: Parameter implicitly has an any type',
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

export function ExpandFlow() {
  return (
    <Stack p="xl" maw={520}>
      <ContextEventRow
        kind="directory"
        label="src/auth"
        detail="3 files"
        items={['session.ts', 'client.ts', 'refresh.ts']}
      />
      <ContextEventRow kind="skill" label="pdf" labels={{ skill: 'Using skill' }} />
    </Stack>
  );
}

ExpandFlow.play = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
  const canvas = within(canvasElement);
  await expect(canvas.getByText('Listed')).toBeInTheDocument();
  await expect(canvas.getByText('Using skill')).toBeInTheDocument();
  const toggles = canvas.getAllByRole('button');
  await expect(toggles).toHaveLength(1);
  await expect(toggles[0]).toHaveAttribute('aria-expanded', 'false');
  await userEvent.click(toggles[0]);
  await expect(toggles[0]).toHaveAttribute('aria-expanded', 'true');
  await waitFor(() => expect(canvas.getByText('refresh.ts')).toBeVisible());
};
