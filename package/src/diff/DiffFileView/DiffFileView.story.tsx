import React from 'react';
import { expect, fn, userEvent, waitFor, within } from '@storybook/test';
import { Checkbox, Stack } from '@mantine/core';
import { NARROW_WIDTH, WIDE_WIDTH, WidthFrame } from '../../_stories/WidthFrame';
import { DIFF_EXTRA_FIXTURES, DIFF_FIXTURES } from '../fixtures';
import { demoHighlighter } from '../../tools/_stories-shared';
import { DiffFileView, type DiffViewMode } from './DiffFileView';

export default { title: 'diff/DiffFileView' };

const byPath = (suffix: string) => DIFF_FIXTURES.find((change) => change.path.endsWith(suffix))!;

export function Usage() {
  return (
    <Stack p="xl" maw={760}>
      <DiffFileView
        change={byPath('invoice.ts')}
        headerActions={<Checkbox size="xs" label="Viewed" />}
      />
    </Stack>
  );
}

export function Narrow() {
  return (
    <WidthFrame width={NARROW_WIDTH}>
      <DiffFileView change={byPath('invoice.ts')} />
    </WidthFrame>
  );
}

export function Wide() {
  return (
    <WidthFrame width={WIDE_WIDTH}>
      <DiffFileView change={byPath('invoice.ts')} defaultMode="split" />
    </WidthFrame>
  );
}

export function Added() {
  return (
    <WidthFrame width={WIDE_WIDTH}>
      <DiffFileView change={byPath('invoice.test.ts')} />
    </WidthFrame>
  );
}

export function Deleted() {
  return (
    <WidthFrame width={WIDE_WIDTH}>
      <DiffFileView change={byPath('fetch-totals.ts')} />
    </WidthFrame>
  );
}

export function RenamedAndBinary() {
  return (
    <WidthFrame width={WIDE_WIDTH}>
      <Stack gap="md">
        <DiffFileView change={byPath('README.md')} />
        <DiffFileView change={byPath('.png')} />
      </Stack>
    </WidthFrame>
  );
}

export function UntrackedAndTooLarge() {
  return (
    <WidthFrame width={WIDE_WIDTH}>
      <Stack gap="md">
        {DIFF_EXTRA_FIXTURES.map((change) => (
          <DiffFileView key={change.path} change={change} />
        ))}
      </Stack>
    </WidthFrame>
  );
}

export function SyntaxHighlighting() {
  return (
    <WidthFrame width={WIDE_WIDTH}>
      <DiffFileView
        change={byPath('invoice.ts')}
        highlighter={demoHighlighter}
        defaultMode="split"
      />
    </WidthFrame>
  );
}

type ViewArgs = { onModeChange: (mode: DiffViewMode) => void };
type FlowContext<A> = { canvasElement: HTMLElement; args: A };

export const ModesFlow = {
  args: { onModeChange: fn() },
  render: (args: ViewArgs) => (
    <WidthFrame width={WIDE_WIDTH}>
      <DiffFileView change={byPath('invoice.ts')} onModeChange={args.onModeChange} />
    </WidthFrame>
  ),
  play: async ({ canvasElement, args }: FlowContext<ViewArgs>) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole('radio', { name: 'Split' }));
    await expect(args.onModeChange).toHaveBeenCalledWith('split');
    await waitFor(() =>
      expect(canvasElement.querySelector('table[data-mode="split"]')).toBeInTheDocument()
    );
    await expect(canvasElement.querySelectorAll('td[data-type="empty"]').length).toBeGreaterThan(0);
    await userEvent.click(canvas.getByRole('radio', { name: 'Unified' }));
    await expect(args.onModeChange).toHaveBeenLastCalledWith('unified');
    await expect(canvasElement.querySelector('table[data-mode="unified"]')).toBeInTheDocument();
  },
};

export const ShowUnchangedFlow = {
  args: { onModeChange: fn() },
  render: (args: ViewArgs) => (
    <WidthFrame width={640}>
      <DiffFileView change={byPath('invoice.ts')} onModeChange={args.onModeChange} />
    </WidthFrame>
  ),
  play: async ({ canvasElement }: FlowContext<ViewArgs>) => {
    const canvas = within(canvasElement);
    const rows = () => canvasElement.querySelectorAll('tbody tr').length;
    const before = rows();
    const gaps = canvas.getAllByRole('button', { name: /Show \d+ unchanged lines?/ });
    await userEvent.click(gaps[0]);
    await expect(rows()).toBeGreaterThan(before);
    await expect(canvas.getAllByRole('button', { name: /unchanged/ })).toHaveLength(
      gaps.length - 1
    );
    await expect(canvasElement.querySelector('ins[data-type="added"]')).toBeInTheDocument();
  },
};

export const TooLargeFlow = {
  args: { onModeChange: fn() },
  render: () => (
    <WidthFrame width={640}>
      <Stack gap="md">
        {DIFF_EXTRA_FIXTURES.map((change) => (
          <DiffFileView key={change.path} change={change} />
        ))}
      </Stack>
    </WidthFrame>
  ),
  play: async ({ canvasElement }: FlowContext<ViewArgs>) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('New untracked file')).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: 'Show content' }));
    await expect(canvasElement.querySelectorAll('tr[data-type="add"]')).toHaveLength(5);

    await expect(canvas.getByText('File too large to display')).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: 'Show anyway' }));
    await waitFor(
      () => expect(canvas.queryByText('File too large to display')).not.toBeInTheDocument(),
      {
        timeout: 5000,
      }
    );
    await expect(canvas.getAllByText(/decimal\.js/).length).toBeGreaterThan(0);
  },
};
