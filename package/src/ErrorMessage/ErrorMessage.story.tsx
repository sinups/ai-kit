import React from 'react';
import { expect, fn, userEvent, waitFor, within } from '@storybook/test';
import { Stack } from '@mantine/core';
import { NARROW_WIDTH, WIDE_WIDTH, WidthFrame } from '../_stories/WidthFrame';
import { ErrorMessage } from './ErrorMessage';

export default { title: 'ErrorMessage' };

const LONG_TRACE = [
  'TypeError: Cannot read properties of undefined (reading "map")',
  ...Array.from(
    { length: 14 },
    (_, index) =>
      `    at renderRows (src/components/ResultsTable.tsx:${120 + index * 7}:${12 + index})`
  ),
].join('\n');

function Demo() {
  return (
    <Stack gap={16}>
      <ErrorMessage message="The model returned an empty response. Please try again." />
      <ErrorMessage
        title="Request failed"
        message="Network error: failed to fetch (status 502 Bad Gateway)"
      />
      <ErrorMessage
        title="API overloaded"
        message="The provider is temporarily overloaded."
        retry={{ attempt: 2, maxAttempts: 10, retryAt: Date.now() + 8000 }}
        onRetry={() => console.log('retry')}
      />
      <ErrorMessage
        variant="warning"
        title="Usage limit reached"
        message="You have used all requests available on your plan."
        resetsAt={Date.now() + 45 * 60 * 1000}
      />
      <ErrorMessage title="Tool crashed" message={LONG_TRACE} collapsible onRetry={() => {}} />
    </Stack>
  );
}

export function Usage() {
  return (
    <div
      style={{
        padding: 40,
        maxWidth: 420,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      <ErrorMessage message="The model returned an empty response. Please try again." />
      <ErrorMessage
        title="Request failed"
        message="Network error: failed to fetch (status 502 Bad Gateway)"
      />
    </div>
  );
}

export function LongMessage() {
  return (
    <WidthFrame width={NARROW_WIDTH}>
      <ErrorMessage title="Tool crashed" message={LONG_TRACE} collapsible onRetry={() => {}} />
    </WidthFrame>
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

export const RetryFlow = {
  args: { onRetry: fn() },
  render: ({ onRetry }: { onRetry: () => void }) => (
    <Stack p={32} maw={520}>
      <ErrorMessage
        variant="warning"
        message="Usage limit reached"
        onRetry={onRetry}
        labels={{ retry: 'Try again' }}
      />
    </Stack>
  ),
  play: async ({
    canvasElement,
    args,
  }: {
    canvasElement: HTMLElement;
    args: Record<string, ReturnType<typeof fn>>;
  }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Usage limit reached/)).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: 'Try again' }));
    await expect(args.onRetry).toHaveBeenCalledTimes(1);
  },
};

const STACK_TRACE = Array.from({ length: 10 }, (_, index) => `at frame ${index}`).join('\n');

export function ShowMoreFlow() {
  return (
    <Stack p={32} maw={520}>
      <ErrorMessage title="Tool crashed" message={STACK_TRACE} collapsible />
    </Stack>
  );
}

ShowMoreFlow.play = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
  const canvas = within(canvasElement);
  await expect(canvas.queryByText(/at frame 9/)).not.toBeInTheDocument();
  await userEvent.click(canvas.getByRole('button', { name: 'Show more' }));
  await expect(await canvas.findByText(/at frame 9$/)).toBeInTheDocument();
  await userEvent.click(canvas.getByRole('button', { name: 'Show less' }));
  await waitFor(() => expect(canvas.queryByText(/at frame 9/)).not.toBeInTheDocument());
};
