import React from 'react';
import { expect, userEvent, waitFor, within } from '@storybook/test';
import { Stack } from '@mantine/core';
import { CompactBoundary } from './CompactBoundary';

export default { title: 'CompactBoundary' };

const summary =
  '- Migrated the upload client to the new API\n- Tests for backoff are green\n- Open question: keep the 5 attempt limit?';

export function Usage() {
  return (
    <Stack p={40} maw={520} gap={32}>
      <CompactBoundary tokensBefore={182_400} tokensAfter={12_300} summary={summary} />
      <CompactBoundary tokensAfter={9_800} />
      <CompactBoundary label="History trimmed" />
    </Stack>
  );
}

export function Narrow() {
  return (
    <Stack p={16} w={360} gap={32}>
      <CompactBoundary tokensBefore={1_240_000} tokensAfter={48_000} summary={summary} />
      <CompactBoundary
        tokensBefore={182_400}
        tokensAfter={12_300}
        summary={summary}
        defaultExpanded
      />
    </Stack>
  );
}

export function Wide() {
  return (
    <Stack p={40} w={900} gap={32}>
      <CompactBoundary
        tokensBefore={182_400}
        tokensAfter={12_300}
        summary={summary}
        defaultExpanded
      />
    </Stack>
  );
}

function DirectionExamples() {
  return (
    <>
      <CompactBoundary
        direction="up-to"
        tokensBefore={182_400}
        tokensAfter={12_300}
        userContext="Decisions about the upload retry policy"
        summary={summary}
        defaultExpanded
      />
      <CompactBoundary direction="from" tokensAfter={31_000} userContext="Failing test names" />
      <CompactBoundary direction="from" tokensBefore={96_000} tokensAfter={8_200} />
    </>
  );
}

export function Directions() {
  return (
    <Stack p={40} maw={520} gap={32}>
      <DirectionExamples />
    </Stack>
  );
}

export function DirectionsNarrow() {
  return (
    <Stack p={16} w={360} gap={32}>
      <DirectionExamples />
    </Stack>
  );
}

export function DirectionsWide() {
  return (
    <Stack p={40} w={900} gap={32}>
      <DirectionExamples />
    </Stack>
  );
}

export function ExpandFlow() {
  return (
    <Stack p="xl" maw={520}>
      <CompactBoundary
        direction="up-to"
        tokensBefore={182_400}
        tokensAfter={12_300}
        summary="Kept **decisions** about the auth refactor"
        userContext="decisions about auth"
      />
    </Stack>
  );
}

ExpandFlow.play = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
  const canvas = within(canvasElement);
  const toggle = canvas.getByRole('button', { name: /Summarized up to here/ });
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await userEvent.click(toggle);
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  const decisions = await canvas.findByText('decisions');
  await waitFor(() => expect(decisions).toBeVisible());
  await expect(canvas.getByText('Kept: decisions about auth')).toBeInTheDocument();
  await userEvent.click(toggle);
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
};
