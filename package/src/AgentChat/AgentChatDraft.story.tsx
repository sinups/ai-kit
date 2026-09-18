import React, { useState } from 'react';
import { expect, userEvent, waitFor, within } from '@storybook/test';
import { Button, Code, Group, Paper, Stack, Text } from '@mantine/core';
import type { ChatMessage } from '../types';
import { AgentChat } from './AgentChat';

export default { title: 'AgentChat/Draft' };

const SNIPPET = 'const token = await refresh(session.refreshToken);';

function AskAboutSelectionDemo() {
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  return (
    <Group align="stretch" p="xl" gap="md" wrap="nowrap" h="80vh">
      <Stack gap="xs" w={280}>
        <Text size="sm" fw={500}>
          auth/refresh.ts
        </Text>
        <Code block>{SNIPPET}</Code>
        <Button
          size="xs"
          variant="light"
          w="fit-content"
          onClick={() => setDraft(`Explain this line:\n${SNIPPET}`)}
        >
          Ask about selection
        </Button>
      </Stack>
      <Paper withBorder flex={1} display="flex" style={{ flexDirection: 'column' }}>
        <AgentChat
          messages={messages}
          status="ready"
          onStop={() => {}}
          onSend={({ content }) =>
            setMessages((current) => [
              ...current,
              {
                id: `u${current.length}`,
                role: 'user',
                parts: [{ type: 'text', text: content }],
              },
            ])
          }
          draft={draft}
          onDraftChange={setDraft}
        />
      </Paper>
    </Group>
  );
}

export function AskAboutSelection() {
  return <AskAboutSelectionDemo />;
}

AskAboutSelection.play = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
  const canvas = within(canvasElement);
  await userEvent.click(canvas.getByRole('button', { name: 'Ask about selection' }));
  const field = canvas.getByRole('textbox');
  await expect(field).toHaveValue(`Explain this line:\n${SNIPPET}`);
  await userEvent.click(field);
  await userEvent.keyboard('{Enter}');
  await waitFor(() => expect(field).toHaveValue(''));
};
