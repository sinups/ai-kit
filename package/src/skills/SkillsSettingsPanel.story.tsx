import React, { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from '@storybook/test';
import { Paper } from '@mantine/core';
import { NARROW_WIDTH, WIDE_WIDTH, WidthFrame } from '../_stories/WidthFrame';
import { AVAILABLE_TOOLS, skills as fixtureSkills } from './fixtures';
import { SkillsSettingsPanel, type SkillsSettingsPanelProps } from './SkillsSettingsPanel';
import type { Skill, SkillDraft } from './types';

export default { title: 'Agents & skills/SkillsSettingsPanel' };

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function Demo(props: Partial<SkillsSettingsPanelProps>) {
  const [skills, setSkills] = useState<Skill[]>(fixtureSkills);
  return (
    <Paper withBorder radius="md" h={640} style={{ overflow: 'hidden' }}>
      <SkillsSettingsPanel
        skills={skills}
        availableTools={AVAILABLE_TOOLS}
        onToggle={async (skill, enabled) => {
          await wait(500);
          setSkills((items) =>
            items.map((item) => (item.id === skill.id ? { ...item, enabled } : item))
          );
        }}
        onCreate={async (draft) => {
          await wait(600);
          const created: Skill = { ...draft, id: draft.name, source: 'user', enabled: true };
          setSkills((items) => [...items, created]);
          return created;
        }}
        onUpdate={async (skill, draft) => {
          await wait(600);
          setSkills((items) =>
            items.map((item) => (item.id === skill.id ? { ...item, ...draft } : item))
          );
        }}
        onRemove={(skill) => setSkills((items) => items.filter((item) => item.id !== skill.id))}
        {...props}
      />
    </Paper>
  );
}

export function Usage() {
  return (
    <WidthFrame width={WIDE_WIDTH}>
      <Demo />
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
    <WidthFrame width={1200}>
      <Demo listWidth={380} />
    </WidthFrame>
  );
}

export function Loading() {
  return (
    <WidthFrame width={WIDE_WIDTH}>
      <Demo loading />
    </WidthFrame>
  );
}

type PanelFlowArgs = {
  onToggle: (skill: Skill, enabled: boolean) => void;
  onCreate: (draft: SkillDraft) => void;
  onUpdate: (skill: Skill, draft: SkillDraft) => void;
  onRemove: (skill: Skill) => void;
};

function PanelFlowDemo({ args, width }: { args: PanelFlowArgs; width: number }) {
  const [skills, setSkills] = useState<Skill[]>(fixtureSkills);
  return (
    <WidthFrame width={width}>
      <Paper withBorder radius="md" h={640} style={{ overflow: 'hidden' }}>
        <SkillsSettingsPanel
          skills={skills}
          availableTools={AVAILABLE_TOOLS}
          onToggle={(skill, enabled) => {
            args.onToggle(skill, enabled);
            setSkills((items) =>
              items.map((item) => (item.id === skill.id ? { ...item, enabled } : item))
            );
          }}
          onCreate={(draft) => {
            args.onCreate(draft);
            const created: Skill = { ...draft, id: draft.name, source: 'user', enabled: true };
            setSkills((items) => [...items, created]);
            return created;
          }}
          onUpdate={(skill, draft) => {
            args.onUpdate(skill, draft);
            setSkills((items) =>
              items.map((item) => (item.id === skill.id ? { ...item, ...draft } : item))
            );
          }}
          onRemove={(skill) => {
            args.onRemove(skill);
            setSkills((items) => items.filter((item) => item.id !== skill.id));
          }}
        />
      </Paper>
    </WidthFrame>
  );
}

const panelFlowArgs = () => ({ onToggle: fn(), onCreate: fn(), onUpdate: fn(), onRemove: fn() });

export function EditFlow(args: PanelFlowArgs) {
  return <PanelFlowDemo args={args} width={WIDE_WIDTH} />;
}

EditFlow.args = panelFlowArgs();

EditFlow.play = async ({
  canvasElement,
  args,
}: {
  canvasElement: HTMLElement;
  args: PanelFlowArgs;
}) => {
  const canvas = within(canvasElement);
  const page = within(canvasElement.ownerDocument.body);
  await waitFor(() =>
    expect(canvasElement.querySelector('[data-layout="wide"]')).toBeInTheDocument()
  );

  await userEvent.click(canvas.getByText('code-review'));
  await expect(await canvas.findByRole('heading', { name: 'code-review' })).toBeInTheDocument();

  await userEvent.click(canvas.getByRole('button', { name: 'Edit' }));
  const description = await canvas.findByRole('textbox', { name: /Description/ });
  await userEvent.type(description, '!');

  await userEvent.click(canvas.getByText('release-notes'));
  const dialog = await page.findByRole('dialog', { name: 'Discard changes?' });
  await userEvent.click(within(dialog).getByRole('button', { name: 'Keep editing' }));
  await waitFor(() => expect(page.queryByRole('dialog')).not.toBeInTheDocument());
  await expect(canvas.getByRole('textbox', { name: /Description/ })).toHaveValue(
    `${fixtureSkills[1].description}!`
  );

  await userEvent.clear(canvas.getByRole('textbox', { name: /Description/ }));
  await userEvent.type(canvas.getByRole('textbox', { name: /Description/ }), 'Review diffs');
  await userEvent.click(canvas.getByRole('button', { name: 'Save' }));
  await waitFor(() =>
    expect(args.onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'code-review' }),
      expect.objectContaining({ description: 'Review diffs' })
    )
  );
  await expect(await canvas.findByRole('heading', { name: 'code-review' })).toBeInTheDocument();
  await expect(canvas.getAllByText('Review diffs').length).toBeGreaterThan(0);

  await userEvent.click(canvas.getByRole('switch', { name: 'Enabled: release-notes' }));
  await expect(args.onToggle).toHaveBeenCalledWith(
    expect.objectContaining({ id: 'release-notes' }),
    true
  );
  await waitFor(() =>
    expect(canvas.getByRole('switch', { name: 'Enabled: release-notes' })).toBeChecked()
  );
};

export function DuplicateFlow(args: PanelFlowArgs) {
  return <PanelFlowDemo args={args} width={NARROW_WIDTH} />;
}

DuplicateFlow.args = panelFlowArgs();

DuplicateFlow.play = async ({
  canvasElement,
  args,
}: {
  canvasElement: HTMLElement;
  args: PanelFlowArgs;
}) => {
  const canvas = within(canvasElement);
  const page = within(canvasElement.ownerDocument.body);

  await userEvent.click(canvas.getAllByRole('button', { name: /Skill actions/ })[0]);
  await userEvent.click(await page.findByRole('menuitem', { name: 'Duplicate' }));
  await expect(await canvas.findByRole('textbox', { name: /Name/ })).toHaveValue('pdf-copy');

  await userEvent.click(canvas.getByRole('button', { name: 'Create skill' }));
  await waitFor(() =>
    expect(args.onCreate).toHaveBeenCalledWith(expect.objectContaining({ name: 'pdf-copy' }))
  );
  await expect(await canvas.findByRole('heading', { name: 'pdf-copy' })).toBeInTheDocument();

  await userEvent.click(canvas.getByRole('button', { name: 'Skills' }));
  await expect(await canvas.findByRole('textbox', { name: 'Search skills' })).toBeInTheDocument();
  await expect(canvas.getByText('pdf-copy')).toBeInTheDocument();
};
