import React, { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from '@storybook/test';
import { Paper, Stack } from '@mantine/core';
import { NARROW_WIDTH, WIDE_WIDTH, WidthFrame } from '../../_stories/WidthFrame';
import { DIFF_FIXTURES } from '../fixtures';
import type { FileChange } from '../types';
import { DiffFileList, type DiffFileListProps } from './DiffFileList';

export default { title: 'diff/DiffFileList' };

function Demo(props: Partial<DiffFileListProps>) {
  const [selectedPath, setSelectedPath] = useState<string | null>(DIFF_FIXTURES[0].path);
  return (
    <Paper withBorder radius="md" p="xs">
      <DiffFileList
        changes={DIFF_FIXTURES}
        selectedPath={selectedPath}
        onSelect={(change) => setSelectedPath(change.path)}
        viewedPaths={[DIFF_FIXTURES[1].path]}
        decisions={{ [DIFF_FIXTURES[4].path]: 'accepted' }}
        {...props}
      />
    </Paper>
  );
}

export function Usage() {
  return (
    <Stack p="xl" maw={420}>
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

export function Tree() {
  return (
    <WidthFrame width={NARROW_WIDTH}>
      <Demo defaultView="tree" />
    </WidthFrame>
  );
}

export function Loading() {
  return (
    <WidthFrame width={NARROW_WIDTH}>
      <Demo changes={[]} loading />
    </WidthFrame>
  );
}

export function Error() {
  return (
    <WidthFrame width={NARROW_WIDTH}>
      <Demo changes={[]} error="Could not load the diff" onRetry={() => {}} />
    </WidthFrame>
  );
}

export function Empty() {
  return (
    <WidthFrame width={NARROW_WIDTH}>
      <Demo changes={[]} />
    </WidthFrame>
  );
}

type ListArgs = {
  onSelect: (change: FileChange) => void;
  onViewChange: (view: 'list' | 'tree') => void;
};
type FlowContext<A> = { canvasElement: HTMLElement; args: A };

function FlowList({ onSelect, onViewChange }: ListArgs) {
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  return (
    <WidthFrame width={420}>
      <Paper withBorder radius="md" p="xs">
        <DiffFileList
          changes={DIFF_FIXTURES}
          selectedPath={selectedPath}
          onViewChange={onViewChange}
          onSelect={(change) => {
            setSelectedPath(change.path);
            onSelect(change);
          }}
        />
      </Paper>
    </WidthFrame>
  );
}

export const ListAndTreeFlow = {
  args: { onSelect: fn(), onViewChange: fn() },
  render: (args: ListArgs) => <FlowList {...args} />,
  play: async ({ canvasElement, args }: FlowContext<ListArgs>) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole('option')).toHaveLength(7);
    await userEvent.click(canvas.getByRole('option', { name: /^types\.ts/ }));
    await expect(args.onSelect).toHaveBeenLastCalledWith(
      expect.objectContaining({ path: 'packages/billing/src/types.ts' })
    );

    await userEvent.click(canvas.getByRole('radio', { name: 'Tree' }));
    await expect(args.onViewChange).toHaveBeenCalledWith('tree');
    const tree = await canvas.findByRole('tree');
    await expect(within(tree).getByText('legacy')).toBeInTheDocument();
    await userEvent.click(within(tree).getByText('packages/billing'));
    await expect(within(tree).queryByText('invoice.ts')).not.toBeInTheDocument();
    await userEvent.click(within(tree).getByText('packages/billing'));
    await userEvent.click(within(tree).getByText('invoice.ts'));
    await expect(args.onSelect).toHaveBeenLastCalledWith(
      expect.objectContaining({ path: 'packages/billing/src/invoice.ts' })
    );

    await userEvent.click(canvas.getByRole('radio', { name: 'List' }));
    await expect(args.onViewChange).toHaveBeenLastCalledWith('list');
  },
};

export const SearchAndFilterFlow = {
  args: { onSelect: fn(), onViewChange: fn() },
  render: (args: ListArgs) => <FlowList {...args} />,
  play: async ({ canvasElement }: FlowContext<ListArgs>) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    const search = canvas.getByRole('textbox', { name: 'Filter files' });
    await userEvent.type(search, 'legacy');
    await expect(canvas.getAllByRole('option')).toHaveLength(1);
    await userEvent.type(search, 'zzz');
    await expect(canvas.getByText('No matching files')).toBeInTheDocument();
    await userEvent.clear(search);

    await userEvent.click(canvas.getByLabelText('Change status'));
    await userEvent.click(await page.findByRole('option', { name: 'Added (2)' }));
    await waitFor(() => expect(canvas.getAllByRole('option')).toHaveLength(2));
    await expect(canvas.getByText('7 files changed')).toBeInTheDocument();
  },
};
