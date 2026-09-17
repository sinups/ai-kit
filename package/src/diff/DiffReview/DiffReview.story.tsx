import React, { useState } from 'react';
import { expect, fn, userEvent, within } from '@storybook/test';
import { Box, Button, Paper, Stack } from '@mantine/core';
import { NARROW_WIDTH, WIDE_WIDTH, WidthFrame } from '../../_stories/WidthFrame';
import { DIFF_FIXTURES, DIFF_SOURCES } from '../fixtures';
import type { FileChange, FileDecision } from '../types';
import { DiffReview, type DiffReviewProps } from './DiffReview';
import { DiffReviewModal } from './DiffReviewModal';

export default { title: 'diff/DiffReview' };

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function useDecisions() {
  const [decisions, setDecisions] = useState<Record<string, FileDecision>>({});
  const decide = (decision: FileDecision) => async (change: FileChange) => {
    await wait(500);
    setDecisions((current) => ({ ...current, [change.path]: decision }));
  };
  const decideAll = (decision: FileDecision) => async () => {
    await wait(800);
    setDecisions(Object.fromEntries(DIFF_FIXTURES.map((change) => [change.path, decision])));
  };
  return {
    decisions,
    onAccept: decide('accepted'),
    onReject: decide('rejected'),
    onAcceptAll: decideAll('accepted'),
    onRejectAll: decideAll('rejected'),
  };
}

function Demo(props: Partial<DiffReviewProps>) {
  const decisions = useDecisions();
  return (
    <Paper withBorder radius="md" h={680}>
      <DiffReview changes={DIFF_FIXTURES} {...decisions} {...props} />
    </Paper>
  );
}

export function Usage() {
  return (
    <Box p="xl">
      <Demo />
    </Box>
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
    <WidthFrame width={WIDE_WIDTH + 300}>
      <Demo />
    </WidthFrame>
  );
}

export function ReadOnly() {
  return (
    <WidthFrame width={WIDE_WIDTH + 300}>
      <Paper withBorder radius="md" h={680}>
        <DiffReview changes={DIFF_FIXTURES} defaultViewedPaths={[DIFF_FIXTURES[0].path]} />
      </Paper>
    </WidthFrame>
  );
}

export function RejectedAction() {
  return (
    <WidthFrame width={WIDE_WIDTH + 300}>
      <Demo
        onAcceptAll={async () => {
          await wait(700);
          throw new Error('Could not apply the changes: the working tree has uncommitted edits');
        }}
      />
    </WidthFrame>
  );
}

export function InModal() {
  const [opened, setOpened] = useState(true);
  const decisions = useDecisions();
  return (
    <Stack p="xl" align="flex-start">
      <Button onClick={() => setOpened(true)}>Review 7 changed files</Button>
      <DiffReviewModal
        opened={opened}
        onClose={() => setOpened(false)}
        changes={DIFF_FIXTURES}
        {...decisions}
      />
    </Stack>
  );
}

export function WithSources() {
  const decisions = useDecisions();
  return (
    <WidthFrame width={WIDE_WIDTH + 300}>
      <Paper withBorder radius="md" h={680}>
        <DiffReview sources={DIFF_SOURCES} {...decisions} />
      </Paper>
    </WidthFrame>
  );
}

export function WithSourcesNarrow() {
  return (
    <WidthFrame width={NARROW_WIDTH}>
      <Paper withBorder radius="md" h={680}>
        <DiffReview sources={DIFF_SOURCES} />
      </Paper>
    </WidthFrame>
  );
}

type ReviewArgs = {
  onSelectedPathChange: (path: string | null) => void;
  onViewedPathsChange: (paths: string[]) => void;
  onAccept: (change: FileChange) => Promise<void>;
  onReject: (change: FileChange) => Promise<void>;
  onRejectAll: () => Promise<void>;
  onSourceChange: (id: string) => void;
};
type FlowContext<A> = { canvasElement: HTMLElement; args: A };

const reviewArgs = (): ReviewArgs => ({
  onSelectedPathChange: fn(),
  onViewedPathsChange: fn(),
  onAccept: fn(async () => {}),
  onReject: fn(async () => {}),
  onRejectAll: fn(async () => {
    throw new Error('Could not revert: the working tree has uncommitted edits');
  }),
  onSourceChange: fn(),
});

function FlowReview({ sources, ...args }: ReviewArgs & { sources?: boolean }) {
  return (
    <WidthFrame width={WIDE_WIDTH + 300}>
      <Paper withBorder radius="md" h={600}>
        {sources ? (
          <DiffReview sources={DIFF_SOURCES} {...args} />
        ) : (
          <DiffReview changes={DIFF_FIXTURES} {...args} />
        )}
      </Paper>
    </WidthFrame>
  );
}

export const HotkeysFlow = {
  args: reviewArgs(),
  render: (args: ReviewArgs) => <FlowReview {...args} />,
  play: async ({ canvasElement, args }: FlowContext<ReviewArgs>) => {
    const canvas = within(canvasElement);
    await canvas.findByRole('table');
    await userEvent.keyboard('j');
    await expect(args.onSelectedPathChange).not.toHaveBeenCalled();

    await userEvent.click(canvas.getByText('0 / 7 viewed'));
    await userEvent.keyboard('j');
    await expect(args.onSelectedPathChange).toHaveBeenLastCalledWith(
      'packages/billing/src/types.ts'
    );
    await userEvent.keyboard('j');
    await expect(args.onSelectedPathChange).toHaveBeenLastCalledWith(
      'packages/billing/src/invoice.test.ts'
    );
    await userEvent.keyboard('k');
    await expect(args.onSelectedPathChange).toHaveBeenLastCalledWith(
      'packages/billing/src/types.ts'
    );

    await userEvent.click(canvas.getByRole('textbox', { name: 'Filter files' }));
    await userEvent.keyboard('j');
    await expect(args.onSelectedPathChange).toHaveBeenCalledTimes(3);
  },
};

export const ViewedFlow = {
  args: reviewArgs(),
  render: (args: ReviewArgs) => <FlowReview {...args} />,
  play: async ({ canvasElement, args }: FlowContext<ReviewArgs>) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole('checkbox', { name: 'Viewed' }));
    await expect(canvas.getByText('1 / 7 viewed')).toBeInTheDocument();
    await expect(args.onViewedPathsChange).toHaveBeenLastCalledWith([
      'packages/billing/src/invoice.ts',
    ]);
    await expect(
      within(canvas.getByRole('option', { name: /^invoice\.ts/ })).getByLabelText('Viewed')
    ).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: 'Next file' }));
    await expect(canvas.getByRole('checkbox', { name: 'Viewed' })).not.toBeChecked();
  },
};

export const AcceptRejectFlow = {
  args: reviewArgs(),
  render: (args: ReviewArgs) => <FlowReview {...args} />,
  play: async ({ canvasElement, args }: FlowContext<ReviewArgs>) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole('button', { name: 'Accept' }));
    await expect(args.onAccept).toHaveBeenCalledWith(
      expect.objectContaining({ path: 'packages/billing/src/invoice.ts' })
    );
    await userEvent.click(canvas.getByRole('button', { name: 'Reject' }));
    await expect(args.onReject).toHaveBeenCalledTimes(1);

    await userEvent.click(canvas.getByRole('button', { name: 'Reject all' }));
    await expect(args.onRejectAll).toHaveBeenCalledTimes(1);
    await expect(
      await canvas.findByText('Could not revert: the working tree has uncommitted edits')
    ).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: 'Dismiss' }));
    await expect(
      canvas.queryByText('Could not revert: the working tree has uncommitted edits')
    ).not.toBeInTheDocument();
  },
};

export const SourcesFlow = {
  args: reviewArgs(),
  render: (args: ReviewArgs) => <FlowReview {...args} sources />,
  play: async ({ canvasElement, args }: FlowContext<ReviewArgs>) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText('0 / 9 viewed')).toBeInTheDocument();
    await userEvent.click(await canvas.findByRole('radio', { name: 'Turn 3 (3)' }));
    await expect(args.onSourceChange).toHaveBeenCalledWith('turn-3');
    await expect(canvas.getByText('0 / 3 viewed')).toBeInTheDocument();
    await expect(canvas.getAllByRole('option')).toHaveLength(3);
    await userEvent.click(canvas.getByRole('radio', { name: 'Uncommitted (9)' }));
    await expect(args.onSourceChange).toHaveBeenLastCalledWith('uncommitted');
    await userEvent.click(canvas.getByRole('option', { name: /^yarn\.lock/ }));
    await expect(await canvas.findByText('File too large to display')).toBeInTheDocument();
  },
};
