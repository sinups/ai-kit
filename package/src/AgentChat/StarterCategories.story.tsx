import React, { useState } from 'react';
import { expect, userEvent, within } from '@storybook/test';
import { Paper } from '@mantine/core';
import { IconBook2, IconBug, IconCode } from '@tabler/icons-react';
import { NARROW_WIDTH, WIDE_WIDTH, WidthFrame } from '../_stories/WidthFrame';
import { AgentChat } from './AgentChat';
import { StarterCategories, type StarterCategory } from './StarterCategories';

export default { title: 'AgentChat/StarterCategories' };

type Canvas = { canvasElement: HTMLElement };

const CATEGORIES: StarterCategory[] = [
  {
    id: 'code',
    label: 'Code',
    icon: <IconCode size={14} />,
    starters: [
      { id: 'tests', label: 'Write tests for a file', value: 'Write tests for ' },
      { id: 'review', label: 'Review my branch', value: 'Review the changes in my branch.' },
    ],
  },
  {
    id: 'bugs',
    label: 'Bugs',
    icon: <IconBug size={14} />,
    starters: [{ id: 'flaky', label: 'Find a flaky test', value: 'Find why this test is flaky: ' }],
  },
  {
    id: 'docs',
    label: 'Docs',
    icon: <IconBook2 size={14} />,
    starters: [{ id: 'readme', label: 'Draft a README' }],
  },
];

function CategorizedChat({ layout }: { layout: 'welcome' | 'center' }) {
  const [draft, setDraft] = useState('');
  return (
    <Paper withBorder radius={0} h={520} display="flex" style={{ flexDirection: 'column' }}>
      <AgentChat
        messages={[]}
        status="ready"
        onSend={() => {}}
        onStop={() => {}}
        draft={draft}
        onDraftChange={setDraft}
        contentWidth="100%"
        emptyState={{
          layout,
          title: 'What are we working on?',
          content: (
            <StarterCategories
              categories={CATEGORIES}
              onSelect={(item) => setDraft(item.value ?? item.label)}
            />
          ),
        }}
      />
    </Paper>
  );
}

export function Categorized() {
  return (
    <WidthFrame width={WIDE_WIDTH}>
      <CategorizedChat layout="center" />
    </WidthFrame>
  );
}

export function CategorizedWelcome() {
  return (
    <WidthFrame width={NARROW_WIDTH}>
      <CategorizedChat layout="welcome" />
    </WidthFrame>
  );
}

export const PickStarter = {
  render: () => (
    <WidthFrame width={WIDE_WIDTH}>
      <CategorizedChat layout="center" />
    </WidthFrame>
  ),
  play: async ({ canvasElement }: Canvas) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Bugs' }));
    await expect(canvas.getByRole('button', { name: 'Bugs' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    await userEvent.click(canvas.getByRole('button', { name: 'Find a flaky test' }));
    await expect(canvas.getByRole('textbox')).toHaveValue('Find why this test is flaky: ');
  },
};

async function expectGapAboveComposer(canvasElement: HTMLElement) {
  const canvas = within(canvasElement);
  const starter = await canvas.findByRole('button', { name: 'Write tests for a file' });
  const composer = canvas.getByRole('textbox').closest('[class*="_field_"]');
  await expect(composer).not.toBeNull();
  const gap = (composer?.getBoundingClientRect().top ?? 0) - starter.getBoundingClientRect().bottom;
  await expect(gap).toBeGreaterThanOrEqual(8);
}

export const SpacingCenter = {
  render: () => (
    <WidthFrame width={WIDE_WIDTH}>
      <CategorizedChat layout="center" />
    </WidthFrame>
  ),
  play: async ({ canvasElement }: Canvas) => expectGapAboveComposer(canvasElement),
};

export const SpacingWelcome = {
  render: () => (
    <WidthFrame width={NARROW_WIDTH}>
      <CategorizedChat layout="welcome" />
    </WidthFrame>
  ),
  play: async ({ canvasElement }: Canvas) => expectGapAboveComposer(canvasElement),
};
