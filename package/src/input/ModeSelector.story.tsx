import React, { useState } from 'react';
import { Stack, Text } from '@mantine/core';
import { IconBolt, IconListCheck, IconShieldCheck } from '@tabler/icons-react';
import { expect, userEvent, within } from '@storybook/test';
import { ModeSelector, type ModeOption } from './ModeSelector';

export default { title: 'Input/ModeSelector' };

const MODES: ModeOption[] = [
  {
    id: 'ask',
    label: 'Ask before edits',
    description: 'Confirm every change before it is made',
    icon: IconShieldCheck,
    badge: 'Default',
  },
  {
    id: 'auto',
    label: 'Edit automatically',
    description: 'Make changes without asking',
    icon: IconBolt,
  },
  {
    id: 'plan',
    label: 'Plan mode',
    description: 'Explore and propose a plan first',
    icon: IconListCheck,
  },
];

function Demo() {
  const [mode, setMode] = useState('ask');
  return (
    <Stack p="xl" pt={220} gap="xs" align="flex-start">
      <ModeSelector
        modes={MODES}
        value={mode}
        onChange={setMode}
        shortcuts
        labels={{ title: 'Mode' }}
      />
      <Text size="xs" c="dimmed">
        Selected: {mode}
      </Text>
    </Stack>
  );
}

export function Usage() {
  return <Demo />;
}

export const PickByDigitFlow = {
  render: () => <Demo />,
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Select mode' }));
    await userEvent.keyboard('3');
    await expect(canvas.getByText('Selected: plan')).toBeInTheDocument();
  },
};
