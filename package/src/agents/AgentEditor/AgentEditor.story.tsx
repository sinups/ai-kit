import React, { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from '@storybook/test';
import { Code, Paper, Stack, Text } from '@mantine/core';
import { NARROW_WIDTH, WIDE_WIDTH, WidthFrame } from '../../_stories/WidthFrame';
import { AGENT_MODELS, AGENT_SKILLS, AGENTS, TOOL_CATALOG } from '../fixtures';
import type { AgentDraft } from '../types';
import { AgentEditor, type AgentEditorProps } from './AgentEditor';

export default { title: 'agents/AgentEditor' };

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const NAMES = AGENTS.map((agent) => agent.name);

function Demo(props: Partial<AgentEditorProps>) {
  const [saved, setSaved] = useState<AgentDraft | null>(null);
  const [status, setStatus] = useState('');
  return (
    <Stack gap="md">
      <Paper withBorder radius="md">
        <AgentEditor
          agent={AGENTS[0]}
          catalog={TOOL_CATALOG}
          models={AGENT_MODELS}
          skills={AGENT_SKILLS}
          existingNames={NAMES}
          onSave={async (draft) => {
            await wait(700);
            setSaved(draft);
          }}
          onCancel={() => setStatus('Cancelled')}
          onDirtyChange={(dirty) => setStatus(dirty ? 'Dirty' : 'Clean')}
          {...props}
        />
      </Paper>
      {status && (
        <Text size="xs" c="dimmed">
          {status}
        </Text>
      )}
      {saved && <Code block>{JSON.stringify(saved, null, 2)}</Code>}
    </Stack>
  );
}

export function Usage() {
  return (
    <Stack p="xl" maw={760}>
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

export function NewAgent() {
  return (
    <WidthFrame width={WIDE_WIDTH}>
      <Demo agent={undefined} />
    </WidthFrame>
  );
}

export function Dirty() {
  return (
    <WidthFrame width={WIDE_WIDTH}>
      <Demo
        initialDraft={{
          ...AGENTS[1],
          displayName: 'Test runner (edited)',
          tools: [...(AGENTS[1].tools as string[]), 'mcp__issues__create_issue'],
        }}
        agent={AGENTS[1]}
      />
    </WidthFrame>
  );
}

export function SaveError() {
  return (
    <WidthFrame width={WIDE_WIDTH}>
      <Demo
        agent={AGENTS[2]}
        onSave={async () => {
          await wait(700);
          throw new Error('The agents file changed on disk, reload and try again');
        }}
      />
    </WidthFrame>
  );
}

export function ReadOnly() {
  return (
    <WidthFrame width={WIDE_WIDTH}>
      <Demo agent={AGENTS[4]} />
    </WidthFrame>
  );
}

type EditorFlowArgs = {
  onSave: (draft: AgentDraft) => void | Promise<void>;
  onCancel: () => void;
};

export function DiscardFlow(args: EditorFlowArgs) {
  return (
    <WidthFrame width={WIDE_WIDTH}>
      <Paper withBorder radius="md">
        <AgentEditor
          agent={AGENTS[1]}
          catalog={TOOL_CATALOG}
          models={AGENT_MODELS}
          skills={AGENT_SKILLS}
          existingNames={NAMES}
          onSave={(draft) => args.onSave(draft)}
          onCancel={() => args.onCancel()}
        />
      </Paper>
    </WidthFrame>
  );
}

DiscardFlow.args = { onSave: fn(), onCancel: fn() };

DiscardFlow.play = async ({
  args,
  canvasElement,
}: {
  args: EditorFlowArgs;
  canvasElement: HTMLElement;
}) => {
  const canvas = within(canvasElement);
  const page = within(canvasElement.ownerDocument.body);
  await expect(canvas.getByRole('button', { name: 'Save changes' })).toBeDisabled();

  const description = canvas.getByRole('textbox', { name: /When to use/ });
  await userEvent.type(description, ' Also lint.');
  await expect(canvas.getByText('Unsaved changes')).toBeInTheDocument();
  await expect(canvas.getByRole('button', { name: 'Save changes' })).toBeEnabled();

  await userEvent.click(canvas.getByRole('button', { name: 'Cancel' }));
  const dialog = await page.findByRole('dialog', { name: 'Discard changes?' });
  await userEvent.click(within(dialog).getByRole('button', { name: 'Keep editing' }));
  await waitFor(() => expect(page.queryByRole('dialog')).not.toBeInTheDocument());
  await expect(args.onCancel).not.toHaveBeenCalled();
  await expect(description).toHaveValue(`${AGENTS[1].description} Also lint.`);

  await userEvent.click(canvas.getByRole('button', { name: 'Cancel' }));
  const again = await page.findByRole('dialog', { name: 'Discard changes?' });
  await userEvent.click(within(again).getByRole('button', { name: 'Discard' }));
  await waitFor(() => expect(args.onCancel).toHaveBeenCalledTimes(1));
  await expect(args.onSave).not.toHaveBeenCalled();
};

export function SaveErrorFlow(args: EditorFlowArgs) {
  return <DiscardFlow {...args} />;
}

SaveErrorFlow.args = {
  onSave: fn(async () => {
    throw new Error('The agents file changed on disk, reload and try again');
  }),
  onCancel: fn(),
};

SaveErrorFlow.play = async ({
  args,
  canvasElement,
}: {
  args: EditorFlowArgs;
  canvasElement: HTMLElement;
}) => {
  const canvas = within(canvasElement);
  const displayName = canvas.getByLabelText('Display name');
  await userEvent.clear(displayName);
  await userEvent.type(displayName, 'Test fixer');
  await userEvent.click(canvas.getByRole('button', { name: 'Save changes' }));

  await expect(
    await canvas.findByText('The agents file changed on disk, reload and try again')
  ).toBeInTheDocument();
  await expect(args.onSave).toHaveBeenCalledWith(
    expect.objectContaining({ name: 'test-runner', displayName: 'Test fixer' })
  );
  await expect(canvas.getByText('Unsaved changes')).toBeInTheDocument();
  await expect(canvas.getByRole('button', { name: 'Save changes' })).toBeEnabled();
};
