import React, { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from '@storybook/test';
import { Box, Paper } from '@mantine/core';
import { NARROW_WIDTH, WIDE_WIDTH, WidthFrame } from '../../_stories/WidthFrame';
import { AGENT_MODELS, AGENT_SKILLS, AGENTS, TOOL_CATALOG } from '../fixtures';
import type { AgentDefinition, AgentDraft } from '../types';
import { AgentsSettingsPanel, type AgentsSettingsPanelProps } from './AgentsSettingsPanel';

export default { title: 'agents/AgentsSettingsPanel' };

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function Demo(props: Partial<AgentsSettingsPanelProps>) {
  const [agents, setAgents] = useState<AgentDefinition[]>(AGENTS);
  return (
    <AgentsSettingsPanel
      agents={agents}
      catalog={TOOL_CATALOG}
      models={AGENT_MODELS}
      skills={AGENT_SKILLS}
      defaultSelectedId="agent-code-reviewer"
      onCreate={async (draft: AgentDraft) => {
        await wait(600);
        const agent: AgentDefinition = {
          ...draft,
          id: `agent-${draft.name}`,
          source: 'user',
          updatedAt: new Date().toISOString(),
        };
        setAgents((prev) => [...prev, agent]);
        return agent;
      }}
      onUpdate={async (agent, draft) => {
        await wait(600);
        setAgents((prev) =>
          prev.map((item) =>
            item.id === agent.id ? { ...item, ...draft, updatedAt: new Date().toISOString() } : item
          )
        );
      }}
      onDelete={async (agent) => {
        await wait(600);
        setAgents((prev) => prev.filter((item) => item.id !== agent.id));
      }}
      onGenerate={async (task) => {
        await wait(1200);
        return {
          displayName: 'Release helper',
          description: `Use before a release to prepare notes and check the milestone. ${task}`,
          systemPrompt: 'Collect merged pull requests since the last tag and draft release notes.',
          tools: ['Read', 'mcp__git__get_pull_request', 'mcp__issues__list_issues'],
          color: 'teal',
        };
      }}
      onUseInChat={() => {}}
      {...props}
    />
  );
}

export function Usage() {
  return (
    <Box h="100vh">
      <Demo />
    </Box>
  );
}

export function Narrow() {
  return (
    <WidthFrame width={NARROW_WIDTH}>
      <Paper withBorder radius="md" h={640}>
        <Demo defaultSelectedId={null} />
      </Paper>
    </WidthFrame>
  );
}

export function Wide() {
  return (
    <WidthFrame width={WIDE_WIDTH}>
      <Paper withBorder radius="md" h={640}>
        <Demo />
      </Paper>
    </WidthFrame>
  );
}

export function Loading() {
  return (
    <WidthFrame width={WIDE_WIDTH}>
      <Paper withBorder radius="md" h={480}>
        <AgentsSettingsPanel
          agents={[]}
          catalog={TOOL_CATALOG}
          loading
          onCreate={() => {}}
          onUpdate={() => {}}
          onDelete={() => {}}
        />
      </Paper>
    </WidthFrame>
  );
}

export function Error() {
  return (
    <WidthFrame width={WIDE_WIDTH}>
      <Paper withBorder radius="md" h={480}>
        <AgentsSettingsPanel
          agents={[]}
          catalog={TOOL_CATALOG}
          error="Could not read .agent/agents"
          onRetry={() => {}}
          onCreate={() => {}}
          onUpdate={() => {}}
          onDelete={() => {}}
        />
      </Paper>
    </WidthFrame>
  );
}

type PanelFlowArgs = {
  onUpdate: (agent: AgentDefinition, draft: AgentDraft) => void;
  onDelete: (agent: AgentDefinition) => void;
  onCreate: (draft: AgentDraft) => void;
};

function PanelFlowDemo({ width, args }: { width: number; args: PanelFlowArgs }) {
  const [agents, setAgents] = useState<AgentDefinition[]>(AGENTS);
  return (
    <WidthFrame width={width}>
      <Paper withBorder radius="md" h={640}>
        <AgentsSettingsPanel
          agents={agents}
          catalog={TOOL_CATALOG}
          models={AGENT_MODELS}
          skills={AGENT_SKILLS}
          onCreate={(draft) => {
            args.onCreate(draft);
            const agent: AgentDefinition = { ...draft, id: `agent-${draft.name}`, source: 'user' };
            setAgents((prev) => [...prev, agent]);
            return agent;
          }}
          onUpdate={(agent, draft) => {
            args.onUpdate(agent, draft);
            setAgents((prev) =>
              prev.map((item) => (item.id === agent.id ? { ...item, ...draft } : item))
            );
          }}
          onDelete={(agent) => {
            args.onDelete(agent);
            setAgents((prev) => prev.filter((item) => item.id !== agent.id));
          }}
        />
      </Paper>
    </WidthFrame>
  );
}

export function ManageFlow(args: PanelFlowArgs) {
  return <PanelFlowDemo width={WIDE_WIDTH} args={args} />;
}

ManageFlow.args = { onUpdate: fn(), onDelete: fn(), onCreate: fn() };

ManageFlow.play = async ({
  args,
  canvasElement,
}: {
  args: PanelFlowArgs;
  canvasElement: HTMLElement;
}) => {
  const canvas = within(canvasElement);
  const page = within(canvasElement.ownerDocument.body);
  await waitFor(() =>
    expect(canvasElement.querySelector('[data-layout="wide"]')).toBeInTheDocument()
  );

  await userEvent.click(await canvas.findByText('Test runner'));
  await expect(await canvas.findByRole('heading', { name: 'Test runner' })).toBeInTheDocument();

  await userEvent.click(canvas.getByRole('button', { name: 'Edit' }));
  await userEvent.type(await canvas.findByLabelText('Display name'), ' v2');
  await userEvent.click(canvas.getByRole('option', { name: /Docs writer/ }));
  const confirm = await page.findByRole('dialog', { name: 'Discard changes?' });
  await userEvent.click(within(confirm).getByRole('button', { name: 'Keep editing' }));
  await waitFor(() => expect(page.queryByRole('dialog')).not.toBeInTheDocument());
  await expect(canvas.getByLabelText('Display name')).toHaveValue('Test runner v2');

  await userEvent.click(canvas.getByRole('button', { name: 'Save changes' }));
  await expect(await canvas.findByRole('heading', { name: 'Test runner v2' })).toBeInTheDocument();
  await expect(args.onUpdate).toHaveBeenCalledWith(
    expect.objectContaining({ name: 'test-runner' }),
    expect.objectContaining({ displayName: 'Test runner v2' })
  );

  await userEvent.click(canvas.getByRole('option', { name: /Docs writer/ }));
  await expect(await canvas.findByRole('heading', { name: 'Docs writer' })).toBeInTheDocument();
  await userEvent.click(canvas.getByRole('button', { name: 'More actions' }));
  await userEvent.click(await page.findByRole('menuitem', { name: 'Delete' }));
  const deleteDialog = await page.findByRole('dialog', { name: 'Delete agent?' });
  await expect(within(deleteDialog).getByText(/Docs writer will be removed/)).toBeInTheDocument();
  await userEvent.click(within(deleteDialog).getByRole('button', { name: 'Delete' }));

  await waitFor(() =>
    expect(args.onDelete).toHaveBeenCalledWith(expect.objectContaining({ name: 'docs-writer' }))
  );
  await waitFor(() =>
    expect(canvas.queryByRole('option', { name: /Docs writer/ })).not.toBeInTheDocument()
  );
  await expect(canvas.queryByRole('heading', { name: 'Docs writer' })).not.toBeInTheDocument();
};

export function BackFlow(args: PanelFlowArgs) {
  return <PanelFlowDemo width={NARROW_WIDTH} args={args} />;
}

BackFlow.args = { onUpdate: fn(), onDelete: fn(), onCreate: fn() };

BackFlow.play = async ({
  args,
  canvasElement,
}: {
  args: PanelFlowArgs;
  canvasElement: HTMLElement;
}) => {
  const canvas = within(canvasElement);
  const page = within(canvasElement.ownerDocument.body);

  await userEvent.click(await canvas.findByText('Code reviewer'));
  await userEvent.click(await canvas.findByRole('button', { name: 'Edit' }));
  await userEvent.type(await canvas.findByLabelText('Display name'), ' draft');

  await userEvent.click(canvas.getByRole('button', { name: 'Agents' }));
  const confirm = await page.findByRole('dialog', { name: 'Discard changes?' });
  await userEvent.click(within(confirm).getByRole('button', { name: 'Discard' }));

  await expect(await canvas.findByRole('heading', { name: 'Code reviewer' })).toBeInTheDocument();
  await expect(canvas.queryByLabelText('Display name')).not.toBeInTheDocument();
  await expect(args.onUpdate).not.toHaveBeenCalled();

  await userEvent.click(canvas.getByRole('button', { name: 'Agents' }));
  await expect(await canvas.findByRole('textbox', { name: 'Search agents' })).toBeInTheDocument();
  await waitFor(() => expect(page.queryByRole('dialog')).not.toBeInTheDocument());
};
