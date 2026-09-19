import React from 'react';
import { Stack } from '@mantine/core';
import { expect, userEvent, within } from '@storybook/test';
import { IconGitPullRequest } from '@tabler/icons-react';
import { NARROW_WIDTH, WIDE_WIDTH, WidthFrame } from '../../_stories/WidthFrame';
import type { ChatMessage } from '../../types';
import { UserMessage } from '../../UserMessage/UserMessage';
import type { SlashCommandInfo } from '../types';
import { CommandChip } from './CommandChip';

export default { title: 'Messages/CommandChip' };

const COMMANDS: SlashCommandInfo[] = [
  {
    name: 'review',
    description: 'Review changes in a path',
    icon: <IconGitPullRequest size={12} />,
  },
  { name: 'compact', description: 'Summarize the conversation to free context' },
];

const message = (id: string, text: string): ChatMessage => ({
  id,
  role: 'user',
  parts: [{ type: 'text', text }],
});

function Demo() {
  return (
    <Stack gap="md">
      <UserMessage message={message('1', '/review src/auth --staged')} commands={COMMANDS} />
      <UserMessage message={message('2', '/compact')} commands={COMMANDS} />
      <UserMessage message={message('3', '/usr/local/bin is not on PATH')} commands={COMMANDS} />
    </Stack>
  );
}

export function Usage() {
  return (
    <Stack p="xl" maw={420} gap="md">
      <CommandChip name="review" args="src/auth" description="Review changes in a path" />
      <CommandChip name="init" size="xs" />
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

export const TooltipFlow = {
  render: () => (
    <Stack p="xl" maw={420}>
      <CommandChip name="review" args="src/auth" description="Review changes in a path" />
      <UserMessage message={message('flow', '/usr/local/bin is not on PATH')} commands={COMMANDS} />
    </Stack>
  ),
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement);
    await userEvent.hover(canvas.getByText('review'));
    await expect(
      await within(canvasElement.ownerDocument.body).findByRole('tooltip')
    ).toHaveTextContent('Review changes in a path');
    await expect(canvas.getByText('/usr/local/bin is not on PATH')).toBeVisible();
    await expect(canvasElement.querySelectorAll('[data-command]')).toHaveLength(1);
  },
};
