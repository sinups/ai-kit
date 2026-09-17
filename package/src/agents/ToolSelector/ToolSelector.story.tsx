import React, { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from '@storybook/test';
import { Code, Paper, Stack } from '@mantine/core';
import { NARROW_WIDTH, WIDE_WIDTH, WidthFrame } from '../../_stories/WidthFrame';
import { TOOL_CATALOG } from '../fixtures';
import type { AgentToolSelection } from '../types';
import { summarizeTools } from '../validate-agent';
import { ToolSelector, type ToolSelectorProps } from './ToolSelector';

export default { title: 'agents/ToolSelector' };

function Demo({
  initial = ['Read', 'Grep', 'Glob', 'mcp__git__get_pull_request'],
  ...props
}: Partial<ToolSelectorProps> & { initial?: AgentToolSelection }) {
  const [value, setValue] = useState<AgentToolSelection>(initial);
  return (
    <Stack gap="md">
      <Paper withBorder radius="md" p="md">
        <ToolSelector
          label="Tools"
          description="Give the agent only what the task needs"
          catalog={TOOL_CATALOG}
          value={value}
          onChange={setValue}
          {...props}
        />
      </Paper>
      <Code block>{`${summarizeTools(value, TOOL_CATALOG)}\n${JSON.stringify(value)}`}</Code>
    </Stack>
  );
}

export function Usage() {
  return (
    <Stack p="xl" maw={640}>
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

export function AllTools() {
  return (
    <WidthFrame width={WIDE_WIDTH}>
      <Demo initial="all" defaultCollapsedGroups={['MCP: git', 'MCP: issues']} />
    </WidthFrame>
  );
}

export function WithError() {
  return (
    <WidthFrame width={NARROW_WIDTH}>
      <Demo initial={[]} error="Select at least one tool" />
    </WidthFrame>
  );
}

export function Empty() {
  return (
    <WidthFrame width={NARROW_WIDTH}>
      <Demo initial={[]} catalog={[]} />
    </WidthFrame>
  );
}

type SelectionFlowArgs = { onChange: (value: AgentToolSelection) => void };

function SelectionFlowDemo({ onChange }: SelectionFlowArgs) {
  const [value, setValue] = useState<AgentToolSelection>(['Read']);
  return (
    <WidthFrame width={WIDE_WIDTH}>
      <ToolSelector
        label="Tools"
        catalog={TOOL_CATALOG}
        value={value}
        onChange={(next) => {
          setValue(next);
          onChange(next);
        }}
      />
    </WidthFrame>
  );
}

export function SelectionFlow(args: SelectionFlowArgs) {
  return <SelectionFlowDemo onChange={(value) => args.onChange(value)} />;
}

SelectionFlow.args = { onChange: fn() };

SelectionFlow.play = async ({
  args,
  canvasElement,
}: {
  args: SelectionFlowArgs;
  canvasElement: HTMLElement;
}) => {
  const canvas = within(canvasElement);
  await expect(canvas.getByText('1 of 16 selected')).toBeInTheDocument();

  const postgres = canvas.getByRole('checkbox', { name: 'MCP: postgres' });
  await userEvent.click(postgres);
  await expect(args.onChange).toHaveBeenLastCalledWith([
    'Read',
    'mcp__postgres__query',
    'mcp__postgres__execute',
  ]);
  await expect(canvas.getByText('3 of 16 selected')).toBeInTheDocument();

  await userEvent.click(canvas.getByRole('checkbox', { name: /Execute statement/ }));
  await waitFor(() =>
    expect(canvas.getByRole('checkbox', { name: 'MCP: postgres' })).toHaveAttribute(
      'data-indeterminate',
      'true'
    )
  );

  await userEvent.type(canvas.getByRole('textbox', { name: 'Search tools' }), 'merge');
  await expect(canvas.getByRole('checkbox', { name: /Merge pull request/ })).toBeInTheDocument();
  await expect(canvas.queryByRole('checkbox', { name: /^Read/ })).not.toBeInTheDocument();
  await userEvent.clear(canvas.getByRole('textbox', { name: 'Search tools' }));

  await userEvent.click(canvas.getByRole('radio', { name: 'All tools' }));
  await expect(args.onChange).toHaveBeenLastCalledWith('all');
  await expect(canvas.getByText('16 of 16 selected')).toBeInTheDocument();
  await expect(canvas.getByRole('checkbox', { name: /^Grep/ })).toBeDisabled();

  await userEvent.click(canvas.getByRole('radio', { name: 'Selected' }));
  await expect(args.onChange).toHaveBeenLastCalledWith(['Read', 'mcp__postgres__query']);
  await expect(canvas.getByText('2 of 16 selected')).toBeInTheDocument();
};
