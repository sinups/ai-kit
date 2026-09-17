import React from 'react';
import { Paper, Stack } from '@mantine/core';
import { expect, fn, userEvent, waitFor, within } from '@storybook/test';
import { NARROW_WIDTH, WIDE_WIDTH, WidthFrame } from '../../_stories/WidthFrame';
import { wait } from '../_story-helpers';
import { FeedbackForm } from './FeedbackForm';

export default { title: 'message-actions/FeedbackForm' };

function Demo({ fail = false }: { fail?: boolean }) {
  return (
    <Paper withBorder radius="md" p="md">
      <FeedbackForm
        value="down"
        onSubmit={async () => {
          await wait(700);
          if (fail) {
            throw new Error('Feedback service is unavailable');
          }
        }}
        onSkip={() => wait(300)}
      />
    </Paper>
  );
}

export function Usage() {
  return (
    <Stack p="xl" maw={340}>
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

export function Positive() {
  return (
    <Stack p="xl" maw={340}>
      <Paper withBorder radius="md" p="md">
        <FeedbackForm value="up" />
      </Paper>
    </Stack>
  );
}

export function SubmitError() {
  return (
    <Stack p="xl" maw={340}>
      <Demo fail />
    </Stack>
  );
}

function FlowFrame({ children }: { children: React.ReactNode }) {
  return (
    <Stack p="xl" maw={340}>
      <Paper withBorder radius="md" p="md">
        {children}
      </Paper>
    </Stack>
  );
}

export const SubmitFlow = {
  args: { onSubmit: fn(), onSkip: fn() },
  render: (args: Record<string, any>) => (
    <FlowFrame>
      <FeedbackForm value="down" onSubmit={args.onSubmit} onSkip={args.onSkip} />
    </FlowFrame>
  ),
  play: async ({
    canvasElement,
    args,
  }: {
    canvasElement: HTMLElement;
    args: Record<string, any>;
  }) => {
    const canvas = within(canvasElement);
    const submit = canvas.getByRole('button', { name: 'Send feedback' });
    await expect(submit).toBeDisabled();
    await userEvent.click(canvas.getByRole('checkbox', { name: 'Too slow' }));
    await userEvent.type(canvas.getByRole('textbox', { name: 'Details' }), '  Took a minute ');
    await userEvent.click(submit);
    await expect(args.onSubmit).toHaveBeenCalledWith({
      reasons: ['too-slow'],
      comment: 'Took a minute',
    });
    await waitFor(() => expect(canvas.getByText('Thanks for your feedback')).toBeVisible());
  },
};

export const SkipFlow = {
  args: { onSubmit: fn(), onSkip: fn() },
  render: SubmitFlow.render,
  play: async ({
    canvasElement,
    args,
  }: {
    canvasElement: HTMLElement;
    args: Record<string, any>;
  }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Skip' }));
    await expect(args.onSkip).toHaveBeenCalledTimes(1);
    await expect(args.onSubmit).not.toHaveBeenCalled();
    await waitFor(() => expect(canvas.getByText('Thanks for your feedback')).toBeVisible());
  },
};

export const SubmitErrorFlow = {
  args: {
    onSubmit: fn(async () => {
      throw new Error('Feedback service is unavailable');
    }),
  },
  render: (args: Record<string, any>) => (
    <FlowFrame>
      <FeedbackForm value="down" onSubmit={args.onSubmit} />
    </FlowFrame>
  ),
  play: async ({
    canvasElement,
    args,
  }: {
    canvasElement: HTMLElement;
    args: Record<string, any>;
  }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('checkbox', { name: 'Inaccurate' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Send feedback' }));
    await expect(args.onSubmit).toHaveBeenCalled();
    await waitFor(() => expect(canvas.getByText('Feedback service is unavailable')).toBeVisible());
    await expect(canvas.queryByText('Thanks for your feedback')).toBeNull();
    await expect(canvas.getByRole('checkbox', { name: 'Inaccurate' })).toBeChecked();
  },
};
