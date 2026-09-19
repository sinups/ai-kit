import React, { useState } from 'react';
import { expect, userEvent, within } from '@storybook/test';
import { Badge, Stack } from '@mantine/core';
import { ArtifactCard } from './ArtifactCard';

export default { title: 'Messages/ArtifactCard' };

function CardsDemo() {
  const [opened, setOpened] = useState('none');
  return (
    <Stack p="xl" maw={480} gap="sm">
      <Badge variant="light" w="fit-content">{`Opened: ${opened}`}</Badge>
      <ArtifactCard
        artifact={{
          type: 'artifact',
          id: 'notes',
          title: 'Release notes',
          kind: 'Document',
          version: 2,
        }}
        onOpen={(artifact) => setOpened(artifact.id)}
      />
      <ArtifactCard
        artifact={{
          type: 'artifact',
          id: 'schema',
          title: 'Database schema',
          kind: 'Code',
          status: 'streaming',
        }}
        onOpen={(artifact) => setOpened(artifact.id)}
      />
    </Stack>
  );
}

export const Usage = {
  render: () => <CardsDemo />,
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Open Release notes' }));
    await expect(canvas.getByText('Opened: notes')).toBeVisible();
    await expect(canvas.getByText('Writing…')).toBeVisible();
  },
};
