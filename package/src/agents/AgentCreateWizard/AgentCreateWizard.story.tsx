import React, { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from '@storybook/test';
import { Button, Code, Stack } from '@mantine/core';
import { AGENT_MODELS, AGENT_SKILLS, AGENTS, TOOL_CATALOG } from '../fixtures';
import type { AgentDraft } from '../types';
import { AgentCreateWizard, type AgentCreateWizardProps } from './AgentCreateWizard';

export default { title: 'Agents & skills/AgentCreateWizard' };

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function generate(task: string): Promise<Partial<AgentDraft>> {
  await wait(1500);
  return {
    displayName: 'Security reviewer',
    description: `Use when a change touches authentication, secrets or user input. Task: ${task}`,
    systemPrompt: `You review changes for security issues.

## Check
- Injection through user input
- Secrets committed to the repository
- Missing authorization checks

Report each finding with the file, line and a fix.`,
    tools: [
      'Read',
      'Grep',
      'Glob',
      'mcp__git__get_pull_request',
      'mcp__git__create_review_comment',
    ],
    model: 'qwen-2.5-coder-32b',
    color: 'red',
  };
}

function Demo(props: Partial<AgentCreateWizardProps>) {
  const [opened, setOpened] = useState(true);
  const [created, setCreated] = useState<AgentDraft | null>(null);
  return (
    <Stack p="xl" align="flex-start">
      <Button onClick={() => setOpened(true)}>New agent</Button>
      {created && <Code block>{JSON.stringify(created, null, 2)}</Code>}
      <AgentCreateWizard
        opened={opened}
        onClose={() => setOpened(false)}
        onCreate={async (draft) => {
          await wait(700);
          setCreated(draft);
        }}
        onGenerate={generate}
        catalog={TOOL_CATALOG}
        models={AGENT_MODELS}
        skills={AGENT_SKILLS}
        existingNames={AGENTS.map((agent) => agent.name)}
        {...props}
      />
    </Stack>
  );
}

export function Usage() {
  return <Demo />;
}

export function Manual() {
  return <Demo onGenerate={undefined} />;
}

export function Generating() {
  return <Demo onGenerate={() => new Promise(() => {})} />;
}

export function GenerateError() {
  return (
    <Demo
      onGenerate={async () => {
        await wait(900);
        throw new Error('The model is overloaded, try again in a minute');
      }}
    />
  );
}

export function CreateError() {
  return (
    <Demo
      onGenerate={undefined}
      initialDraft={{ ...AGENTS[1], name: 'test-runner-2' }}
      onCreate={async () => {
        await wait(700);
        throw new Error('Could not write .agent/agents/test-runner-2.md');
      }}
    />
  );
}

type WizardFlowArgs = {
  onCreate: (draft: AgentDraft) => void | Promise<void>;
  onClose: () => void;
  onGenerate?: (task: string) => Promise<Partial<AgentDraft>>;
};

function WizardFlowDemo({ onCreate, onClose, onGenerate }: WizardFlowArgs) {
  return (
    <AgentCreateWizard
      opened
      onClose={() => onClose()}
      onCreate={(draft) => onCreate(draft)}
      onGenerate={onGenerate && ((task) => onGenerate(task))}
      catalog={TOOL_CATALOG}
      models={AGENT_MODELS}
      skills={AGENT_SKILLS}
      existingNames={AGENTS.map((agent) => agent.name)}
    />
  );
}

export function ManualFlow(args: WizardFlowArgs) {
  return <WizardFlowDemo onCreate={args.onCreate} onClose={args.onClose} />;
}

ManualFlow.args = { onCreate: fn(), onClose: fn() };

ManualFlow.play = async ({
  args,
  canvasElement,
}: {
  args: WizardFlowArgs;
  canvasElement: HTMLElement;
}) => {
  const page = within(canvasElement.ownerDocument.body);
  const next = () => userEvent.click(page.getByRole('button', { name: 'Next' }));

  await userEvent.type(await page.findByLabelText('Display name'), 'Security reviewer');
  await expect(page.getByRole('textbox', { name: /^Name/ })).toHaveValue('security-reviewer');
  await next();
  await expect(await page.findByText(/at least 20 characters/)).toBeInTheDocument();
  await userEvent.type(
    page.getByRole('textbox', { name: /When to use/ }),
    'Use when a change touches authentication or secrets'
  );
  await next();

  await userEvent.type(
    await page.findByRole('textbox', { name: 'System prompt' }),
    'Review the change for security issues.'
  );
  await next();

  await next();
  await expect(await page.findByText('Select at least one tool')).toBeInTheDocument();
  await userEvent.click(page.getByRole('checkbox', { name: /^Read/ }));
  await userEvent.click(page.getByRole('checkbox', { name: /^Grep/ }));
  await next();

  await userEvent.click(await page.findByRole('button', { name: 'Skip' }));
  await expect(await page.findByText('2 tools from Built-in')).toBeInTheDocument();
  await userEvent.click(page.getByRole('button', { name: 'Create agent' }));

  await waitFor(() => expect(args.onClose).toHaveBeenCalled());
  await expect(args.onCreate).toHaveBeenCalledWith(
    expect.objectContaining({
      name: 'security-reviewer',
      displayName: 'Security reviewer',
      systemPrompt: 'Review the change for security issues.',
      tools: ['Read', 'Grep'],
      model: 'inherit',
    })
  );
};

let finishGeneration: (draft: Partial<AgentDraft>) => void = () => {};

export function GenerateFlow(args: WizardFlowArgs) {
  return <WizardFlowDemo {...args} />;
}

GenerateFlow.args = {
  onCreate: fn(),
  onClose: fn(),
  onGenerate: fn(
    () =>
      new Promise<Partial<AgentDraft>>((resolve) => {
        finishGeneration = resolve;
      })
  ),
};

GenerateFlow.play = async ({
  args,
  canvasElement,
}: {
  args: WizardFlowArgs;
  canvasElement: HTMLElement;
}) => {
  const page = within(canvasElement.ownerDocument.body);
  await userEvent.type(
    await page.findByRole('textbox', { name: 'What should the agent do?' }),
    'Prepare release notes'
  );
  await userEvent.click(page.getByRole('button', { name: 'Generate draft' }));
  await expect(args.onGenerate).toHaveBeenCalledWith('Prepare release notes');

  await waitFor(() => expect(page.getByRole('button', { name: 'Next' })).toBeDisabled());
  await expect(page.getByRole('button', { name: 'Cancel' })).toBeDisabled();
  await expect(page.getByRole('radio', { name: /Configure manually/ })).toBeDisabled();

  finishGeneration({
    displayName: 'Release helper',
    description: 'Use before a release to prepare notes from merged pull requests',
    systemPrompt: 'Collect merged pull requests and draft release notes.',
    tools: ['Read', 'mcp__git__get_pull_request'],
  });
  await expect(await page.findByText(/Draft generated/)).toBeInTheDocument();
  await expect(page.getByRole('button', { name: 'Next' })).toBeEnabled();

  await userEvent.click(page.getByRole('button', { name: 'Next' }));
  await expect(await page.findByRole('textbox', { name: /^Name/ })).toHaveValue('release-helper');
  await userEvent.click(page.getByRole('button', { name: 'Next' }));
  await expect(await page.findByRole('textbox', { name: 'System prompt' })).toHaveValue(
    'Collect merged pull requests and draft release notes.'
  );
  await expect(args.onCreate).not.toHaveBeenCalled();
};

export function GenerateErrorFlow(args: WizardFlowArgs) {
  return <WizardFlowDemo {...args} />;
}

GenerateErrorFlow.args = {
  onCreate: fn(),
  onClose: fn(),
  onGenerate: fn(async () => {
    throw new Error('The model is overloaded, try again in a minute');
  }),
};

GenerateErrorFlow.play = async ({
  args,
  canvasElement,
}: {
  args: WizardFlowArgs;
  canvasElement: HTMLElement;
}) => {
  const page = within(canvasElement.ownerDocument.body);
  await userEvent.click(await page.findByRole('button', { name: 'Next' }));
  await expect(
    await page.findByText('Generate a draft or switch to manual configuration')
  ).toBeInTheDocument();

  await userEvent.type(
    page.getByRole('textbox', { name: 'What should the agent do?' }),
    'Triage incidents'
  );
  await userEvent.click(page.getByRole('button', { name: 'Generate draft' }));
  await expect(
    await page.findByText('The model is overloaded, try again in a minute')
  ).toBeInTheDocument();
  await expect(args.onGenerate).toHaveBeenCalledWith('Triage incidents');

  await userEvent.click(page.getByRole('radio', { name: /Configure manually/ }));
  await userEvent.click(page.getByRole('button', { name: 'Next' }));
  await expect(await page.findByLabelText('Display name')).toBeInTheDocument();
  await expect(args.onCreate).not.toHaveBeenCalled();
};
