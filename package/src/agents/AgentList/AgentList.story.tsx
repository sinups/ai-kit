import React, { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from '@storybook/test';
import { Paper, Stack } from '@mantine/core';
import { NARROW_WIDTH, WIDE_WIDTH, WidthFrame } from '../../_stories/WidthFrame';
import { AGENT_MODELS, AGENTS } from '../fixtures';
import type { AgentDefinition } from '../types';
import { AgentList, type AgentListProps } from './AgentList';

export default { title: 'agents/AgentList' };

function Demo(props: Partial<AgentListProps>) {
  const [selectedId, setSelectedId] = useState<string | null>('agent-test-runner');
  return (
    <Paper withBorder radius="md" p="sm">
      <AgentList
        agents={AGENTS}
        models={AGENT_MODELS}
        selectedId={selectedId}
        onSelect={(agent) => setSelectedId(agent.id)}
        onCreate={() => {}}
        onEdit={() => {}}
        onDuplicate={() => {}}
        onDelete={() => {}}
        {...props}
      />
    </Paper>
  );
}

export function Usage() {
  return (
    <Stack p="xl" maw={480}>
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
      <Demo groupBySource={false} />
    </WidthFrame>
  );
}

export function Loading() {
  return (
    <WidthFrame width={NARROW_WIDTH}>
      <Demo agents={[]} loading />
    </WidthFrame>
  );
}

export function Error() {
  return (
    <WidthFrame width={NARROW_WIDTH}>
      <Demo
        agents={[]}
        error="Could not load agents: the settings file is invalid"
        onRetry={() => {}}
      />
    </WidthFrame>
  );
}

export function Empty() {
  return (
    <WidthFrame width={NARROW_WIDTH}>
      <Demo agents={[]} />
    </WidthFrame>
  );
}

type ActionsFlowArgs = {
  onSelect: (agent: AgentDefinition) => void;
  onCreate: () => void;
  onEdit: (agent: AgentDefinition) => void;
  onDuplicate: (agent: AgentDefinition) => void;
  onDelete: (agent: AgentDefinition) => void;
};

export function SearchActionsFlow(args: ActionsFlowArgs) {
  return (
    <WidthFrame width={WIDE_WIDTH}>
      <Paper withBorder radius="md" p="sm">
        <AgentList
          agents={AGENTS}
          models={AGENT_MODELS}
          onSelect={(agent) => args.onSelect(agent)}
          onCreate={() => args.onCreate()}
          onEdit={(agent) => args.onEdit(agent)}
          onDuplicate={(agent) => args.onDuplicate(agent)}
          onDelete={(agent) => args.onDelete(agent)}
        />
      </Paper>
    </WidthFrame>
  );
}

SearchActionsFlow.args = {
  onSelect: fn(),
  onCreate: fn(),
  onEdit: fn(),
  onDuplicate: fn(),
  onDelete: fn(),
};

SearchActionsFlow.play = async ({
  args,
  canvasElement,
}: {
  args: ActionsFlowArgs;
  canvasElement: HTMLElement;
}) => {
  const canvas = within(canvasElement);
  const page = within(canvasElement.ownerDocument.body);
  const search = canvas.getByRole('textbox', { name: 'Search agents' });

  await userEvent.type(search, 'review');
  await waitFor(() => expect(canvas.getAllByRole('option')).toHaveLength(1));
  await userEvent.click(canvas.getByText('Code reviewer'));
  await expect(args.onSelect).toHaveBeenCalledWith(
    expect.objectContaining({ name: 'code-reviewer' })
  );

  await userEvent.clear(search);
  await userEvent.type(search, 'nothing-matches');
  await expect(await canvas.findByText('No agents match the search')).toBeInTheDocument();
  await userEvent.clear(search);

  const builtin = await canvas.findByRole('option', { name: /General purpose/ });
  await userEvent.click(within(builtin).getByRole('button', { name: /^Agent actions/ }));
  await expect(await page.findByRole('menuitem', { name: 'Edit' })).toBeDisabled();
  await expect(page.getByRole('menuitem', { name: 'Delete' })).toBeDisabled();
  await userEvent.click(page.getByRole('menuitem', { name: 'Duplicate' }));
  await expect(args.onDuplicate).toHaveBeenCalledWith(
    expect.objectContaining({ name: 'general-purpose' })
  );

  await waitFor(() => expect(page.queryByRole('menu')).not.toBeInTheDocument());
  const docs = canvas.getByRole('option', { name: /Docs writer/ });
  await userEvent.click(within(docs).getByRole('button', { name: /^Agent actions/ }));
  await userEvent.click(await page.findByRole('menuitem', { name: 'Delete' }));
  await expect(args.onDelete).toHaveBeenCalledWith(
    expect.objectContaining({ name: 'docs-writer' })
  );
  await expect(args.onEdit).not.toHaveBeenCalled();

  await userEvent.click(canvas.getByRole('button', { name: 'New agent' }));
  await expect(args.onCreate).toHaveBeenCalledTimes(1);
};
