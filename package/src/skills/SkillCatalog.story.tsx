import React, { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from '@storybook/test';
import { NARROW_WIDTH, WIDE_WIDTH, WidthFrame } from '../_stories/WidthFrame';
import { skills as fixtureSkills } from './fixtures';
import { SkillCatalog, type SkillCatalogProps } from './SkillCatalog';
import type { Skill } from './types';

export default { title: 'skills/SkillCatalog' };

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function Demo(props: Partial<SkillCatalogProps>) {
  const [skills, setSkills] = useState<Skill[]>(fixtureSkills);
  const [selectedId, setSelectedId] = useState<string | null>('code-review');
  return (
    <SkillCatalog
      skills={skills}
      selectedId={selectedId}
      onSelect={(skill) => setSelectedId(skill.id)}
      onToggle={async (skill, enabled) => {
        await wait(700);
        if (skill.source === 'remote') {
          throw new Error(`${skill.name} is managed by your organization`);
        }
        setSkills((items) =>
          items.map((item) => (item.id === skill.id ? { ...item, enabled } : item))
        );
      }}
      onEdit={() => {}}
      onDuplicate={() => {}}
      onRemove={(skill) => setSkills((items) => items.filter((item) => item.id !== skill.id))}
      onCreate={() => {}}
      {...props}
    />
  );
}

export function Usage() {
  return (
    <WidthFrame width={520}>
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
    <WidthFrame width={WIDE_WIDTH}>
      <Demo />
    </WidthFrame>
  );
}

export function Grid() {
  return (
    <WidthFrame width={WIDE_WIDTH}>
      <Demo variant="grid" />
    </WidthFrame>
  );
}

export function GridNarrow() {
  return (
    <WidthFrame width={NARROW_WIDTH}>
      <Demo variant="grid" />
    </WidthFrame>
  );
}

export function Loading() {
  return (
    <WidthFrame width={520}>
      <Demo loading />
    </WidthFrame>
  );
}

export const ErrorState = {
  name: 'Error',
  render: () => (
    <WidthFrame width={520}>
      <Demo error="Could not load skills: the plugin registry is unreachable." onRetry={() => {}} />
    </WidthFrame>
  ),
};

export function Empty() {
  return (
    <WidthFrame width={520}>
      <Demo skills={[]} />
    </WidthFrame>
  );
}

type CatalogFlowArgs = {
  onToggle: (skill: Skill, enabled: boolean) => Promise<void>;
  onSelect: (skill: Skill) => void;
  onSourceChange: (source: string) => void;
};

function CatalogFlowDemo({
  args,
  variant,
}: {
  args: CatalogFlowArgs;
  variant?: SkillCatalogProps['variant'];
}) {
  const [skills, setSkills] = useState<Skill[]>(fixtureSkills);
  return (
    <SkillCatalog
      skills={skills}
      variant={variant}
      onSelect={args.onSelect}
      onSourceChange={args.onSourceChange}
      onToggle={async (skill, enabled) => {
        await args.onToggle(skill, enabled);
        setSkills((items) =>
          items.map((item) => (item.id === skill.id ? { ...item, enabled } : item))
        );
      }}
    />
  );
}

export function SearchFilterFlow(args: CatalogFlowArgs) {
  return (
    <WidthFrame width={520}>
      <CatalogFlowDemo args={args} />
    </WidthFrame>
  );
}

SearchFilterFlow.args = { onToggle: fn(), onSelect: fn(), onSourceChange: fn() };

SearchFilterFlow.play = async ({
  canvasElement,
  args,
}: {
  canvasElement: HTMLElement;
  args: CatalogFlowArgs;
}) => {
  const canvas = within(canvasElement);
  const page = within(canvasElement.ownerDocument.body);
  await expect(canvas.getAllByRole('option')).toHaveLength(5);

  const search = canvas.getByRole('textbox', { name: 'Search skills' });
  await userEvent.type(search, 'writng');
  await waitFor(() => expect(canvas.getAllByRole('option')).toHaveLength(1));
  await expect(canvas.getByRole('option')).toHaveTextContent('release-notes');

  await userEvent.type(search, 'zzz');
  await expect(await canvas.findByText('No skills match your search')).toBeInTheDocument();
  await userEvent.clear(search);

  await userEvent.click(canvas.getByRole('combobox', { name: 'Source' }));
  await userEvent.click(await page.findByText('Project (1)'));
  await expect(args.onSourceChange).toHaveBeenCalledWith('project');
  await waitFor(() => expect(canvas.getAllByRole('option')).toHaveLength(1));
  await expect(canvas.getByRole('option')).toHaveTextContent('code-review');

  await userEvent.click(canvas.getByText('code-review'));
  await expect(args.onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'code-review' }));
};

export function ToggleFlow(args: CatalogFlowArgs) {
  return (
    <WidthFrame width={520}>
      <CatalogFlowDemo args={args} />
    </WidthFrame>
  );
}

ToggleFlow.args = { onToggle: fn(), onSelect: fn(), onSourceChange: fn() };

ToggleFlow.play = async ({
  canvasElement,
  args,
}: {
  canvasElement: HTMLElement;
  args: CatalogFlowArgs & { onToggle: ReturnType<typeof fn> };
}) => {
  const canvas = within(canvasElement);
  let finish: () => void = () => {};
  args.onToggle.mockImplementationOnce(() => new Promise<void>((resolve) => (finish = resolve)));

  const releaseNotes = canvas.getByRole('switch', { name: 'Enabled: release-notes' });
  await expect(releaseNotes).not.toBeChecked();
  await userEvent.click(releaseNotes);
  await expect(args.onToggle).toHaveBeenCalledWith(
    expect.objectContaining({ id: 'release-notes' }),
    true
  );
  await waitFor(() => expect(releaseNotes).toBeDisabled());
  await expect(args.onSelect).not.toHaveBeenCalled();
  finish();
  await waitFor(() => expect(releaseNotes).toBeChecked());
  await expect(releaseNotes).not.toBeDisabled();

  args.onToggle.mockRejectedValueOnce(
    new Error('incident-runbook is managed by your organization')
  );
  const runbook = canvas.getByRole('switch', { name: 'Enabled: incident-runbook' });
  await userEvent.click(runbook);
  await expect(
    await canvas.findByText('incident-runbook is managed by your organization')
  ).toBeInTheDocument();
  await waitFor(() => expect(runbook).not.toBeDisabled());
  await expect(runbook).not.toBeChecked();
};

export function GridFlow(args: CatalogFlowArgs) {
  return (
    <WidthFrame width={WIDE_WIDTH}>
      <CatalogFlowDemo args={args} variant="grid" />
    </WidthFrame>
  );
}

GridFlow.args = { onToggle: fn(), onSelect: fn(), onSourceChange: fn() };

GridFlow.play = async ({
  canvasElement,
  args,
}: {
  canvasElement: HTMLElement;
  args: CatalogFlowArgs;
}) => {
  const canvas = within(canvasElement);
  await expect(canvas.queryByRole('option')).not.toBeInTheDocument();
  const cards = canvas.getAllByRole('button', { pressed: false });
  await expect(cards.length).toBeGreaterThanOrEqual(5);

  await userEvent.click(canvas.getByRole('button', { name: /figma-tokens/, pressed: false }));
  await expect(args.onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'figma-tokens' }));

  await userEvent.type(canvas.getByRole('textbox', { name: 'Search skills' }), 'pdf');
  await waitFor(() =>
    expect(canvas.queryByRole('button', { name: /figma-tokens/ })).not.toBeInTheDocument()
  );
  await expect(canvas.getByRole('button', { name: /pdf/, pressed: false })).toBeInTheDocument();
};
