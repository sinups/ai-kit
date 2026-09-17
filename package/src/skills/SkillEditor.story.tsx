import React, { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from '@storybook/test';
import { Code, Stack } from '@mantine/core';
import { NARROW_WIDTH, WIDE_WIDTH, WidthFrame } from '../_stories/WidthFrame';
import { AVAILABLE_TOOLS, skills } from './fixtures';
import type { SkillDraft } from './types';
import { SkillEditor, type SkillEditorProps } from './SkillEditor';

export default { title: 'skills/SkillEditor' };

const TAKEN = skills.map((skill) => skill.name);

function Demo(props: Partial<SkillEditorProps>) {
  const [saved, setSaved] = useState<string | null>(null);
  return (
    <Stack gap="md">
      <SkillEditor
        skill={skills[1]}
        availableTools={AVAILABLE_TOOLS}
        takenNames={TAKEN}
        onSave={async (draft) => {
          await new Promise((resolve) => setTimeout(resolve, 800));
          setSaved(JSON.stringify(draft, null, 2));
        }}
        onCancel={() => setSaved('cancelled')}
        {...props}
      />
      {saved && <Code block>{saved}</Code>}
    </Stack>
  );
}

export function Usage() {
  return (
    <WidthFrame width={600}>
      <Demo />
    </WidthFrame>
  );
}

export function New() {
  return (
    <WidthFrame width={600}>
      <Demo skill={null} />
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

export function SaveFails() {
  return (
    <WidthFrame width={600}>
      <Demo
        onSave={async () => {
          await new Promise((resolve) => setTimeout(resolve, 600));
          throw new Error('Project skills are read-only in this workspace');
        }}
      />
    </WidthFrame>
  );
}

type EditorFlowArgs = {
  onSave: (draft: SkillDraft) => Promise<void>;
  onCancel: () => void;
};

export function CreateFlow(args: EditorFlowArgs) {
  return (
    <WidthFrame width={600}>
      <SkillEditor
        skill={null}
        availableTools={AVAILABLE_TOOLS}
        takenNames={TAKEN}
        onSave={args.onSave}
        onCancel={args.onCancel}
      />
    </WidthFrame>
  );
}

CreateFlow.args = { onSave: fn(), onCancel: fn() };

CreateFlow.play = async ({
  canvasElement,
  args,
}: {
  canvasElement: HTMLElement;
  args: EditorFlowArgs;
}) => {
  const canvas = within(canvasElement);
  const name = canvas.getByRole('textbox', { name: /Name/ });

  await userEvent.type(name, 'My Skill');
  await userEvent.click(canvas.getByRole('button', { name: 'Create skill' }));
  await expect(
    await canvas.findByText('Use lowercase letters, digits and single hyphens')
  ).toBeInTheDocument();
  await expect(canvas.getByText('Description is required')).toBeInTheDocument();
  await expect(args.onSave).not.toHaveBeenCalled();

  await userEvent.clear(name);
  await userEvent.type(name, 'pdf');
  await expect(
    await canvas.findByText('A skill with this name already exists')
  ).toBeInTheDocument();

  await userEvent.clear(name);
  await userEvent.type(name, 'lint-fix');
  await userEvent.type(canvas.getByRole('textbox', { name: /Description/ }), 'Fix lint errors');
  await userEvent.type(canvas.getByRole('textbox', { name: 'Instructions' }), '# Lint fixes');

  await userEvent.click(canvas.getByRole('tab', { name: 'Preview' }));
  await expect(await canvas.findByRole('heading', { name: 'Lint fixes' })).toBeInTheDocument();

  await userEvent.click(canvas.getByRole('button', { name: 'Create skill' }));
  await waitFor(() =>
    expect(args.onSave).toHaveBeenCalledWith({
      name: 'lint-fix',
      description: 'Fix lint errors',
      tags: [],
      allowedTools: [],
      content: '# Lint fixes',
    })
  );
};

export function SaveErrorFlow(args: EditorFlowArgs) {
  return (
    <WidthFrame width={600}>
      <SkillEditor
        skill={skills[1]}
        availableTools={AVAILABLE_TOOLS}
        takenNames={TAKEN}
        onSave={args.onSave}
        onCancel={args.onCancel}
      />
    </WidthFrame>
  );
}

SaveErrorFlow.args = {
  onSave: fn(async () => {
    throw new Error('Project skills are read-only in this workspace');
  }),
  onCancel: fn(),
};

SaveErrorFlow.play = async ({
  canvasElement,
  args,
}: {
  canvasElement: HTMLElement;
  args: EditorFlowArgs;
}) => {
  const canvas = within(canvasElement);
  const page = within(canvasElement.ownerDocument.body);

  await expect(canvas.getByRole('button', { name: 'Save' })).toBeDisabled();
  await userEvent.type(canvas.getByRole('textbox', { name: /Description/ }), ' Now faster.');
  await expect(canvas.getByText('Unsaved changes')).toBeInTheDocument();

  await userEvent.click(canvas.getByRole('button', { name: 'Save' }));
  await expect(args.onSave).toHaveBeenCalledWith(expect.objectContaining({ name: 'code-review' }));
  await expect(
    await canvas.findByText('Project skills are read-only in this workspace')
  ).toBeInTheDocument();
  await expect(canvas.getByText('Unsaved changes')).toBeInTheDocument();

  await userEvent.click(canvas.getByRole('button', { name: 'Cancel' }));
  const dialog = await page.findByRole('dialog', { name: 'Discard changes?' });
  await userEvent.click(within(dialog).getByRole('button', { name: 'Discard' }));
  await waitFor(() => expect(args.onCancel).toHaveBeenCalledTimes(1));
};
