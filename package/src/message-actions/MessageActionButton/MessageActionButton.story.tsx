import React, { useState } from 'react';
import { expect, userEvent, within } from '@storybook/test';
import { Stack, Text } from '@mantine/core';
import { IconPin, IconPinFilled, IconShare } from '@tabler/icons-react';
import { MessageActions } from '../MessageActions/MessageActions';
import { MessageActionButton } from './MessageActionButton';

export default { title: 'message-actions/MessageActionButton' };

function HostActionsDemo() {
  const [pinned, setPinned] = useState(false);
  return (
    <Stack p="xl" maw={480} gap="xs">
      <Text size="sm">The deploy finished without errors.</Text>
      <MessageActions
        messageRole="assistant"
        text="The deploy finished without errors."
        onRetry={() => {}}
        visibility="always"
        actions={
          <>
            <MessageActionButton
              label={pinned ? 'Unpin' : 'Pin'}
              icon={pinned ? <IconPinFilled size={16} /> : <IconPin size={16} />}
              active={pinned}
              onClick={() => setPinned((value) => !value)}
            />
            <MessageActionButton label="Share" icon={<IconShare size={16} />} disabled />
          </>
        }
      />
    </Stack>
  );
}

export const InToolbar = {
  render: () => <HostActionsDemo />,
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Pin' }));
    await expect(canvas.getByRole('button', { name: 'Unpin' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  },
};
