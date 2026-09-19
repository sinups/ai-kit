import React, { useState } from 'react';
import { Paper, Stack, Text } from '@mantine/core';
import { MessageList } from '../MessageList/MessageList';
import type { ChatMessage } from '../types';
import { wait } from './_story-helpers';
import { rewindConversation } from './fixtures';
import { RewindDialog } from './RewindDialog/RewindDialog';
import type { MessageFeedbackValue, MessageListActions, SlashCommandInfo } from './types';

export default { title: 'Chat/MessageList/Message actions' };

const COMMANDS: SlashCommandInfo[] = [{ name: 'review', description: 'Review changes in a path' }];

const INITIAL: ChatMessage[] = [
  ...rewindConversation,
  {
    id: 'u4',
    role: 'user',
    createdAt: new Date(),
    parts: [{ type: 'text', text: '/review src/auth' }],
  },
  {
    id: 'a4',
    role: 'assistant',
    parts: [
      { type: 'text', text: 'The refresh flow looks good. One nit: `retryDelay` is never reset.' },
    ],
  },
];

function reply(text: string, id: string): ChatMessage {
  return { id, role: 'assistant', parts: [{ type: 'text', text }] };
}

function FullCycle({ width }: { width: number }) {
  const [messages, setMessages] = useState(INITIAL);
  const [rewindTarget, setRewindTarget] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Record<string, MessageFeedbackValue | undefined>>({});
  const [log, setLog] = useState('Hover a message to see its actions');

  const actions: MessageListActions = {
    feedback,
    onEdit: async (messageId, text) => {
      await wait(600);
      setMessages((current) => {
        const index = current.findIndex((message) => message.id === messageId);
        return [
          ...current.slice(0, index),
          { ...current[index], parts: [{ type: 'text', text }] },
          reply(`Answer to the edited message: “${text}”`, `edit-${Date.now()}`),
        ];
      });
      setLog(`Edited ${messageId}`);
    },
    onRetry: async (messageId) => {
      await wait(900);
      setMessages((current) => {
        const index = current.findIndex((message) => message.id === messageId);
        return [...current.slice(0, index), reply('A regenerated answer.', `retry-${Date.now()}`)];
      });
      setLog(`Regenerated from ${messageId}`);
    },
    onRewind: (messageId) => setRewindTarget(messageId),
    onBranch: (messageId) => setLog(`Branch from ${messageId}`),
    onFeedback: async (messageId, value, details) => {
      await wait(400);
      setFeedback((current) => ({ ...current, [messageId]: value }));
      setLog(`Feedback ${value} on ${messageId}${details ? ` ${JSON.stringify(details)}` : ''}`);
    },
  };

  return (
    <Stack p="xl" gap="xs">
      <Text size="xs" c="dimmed">
        {width}px · {log}
      </Text>
      <Paper
        withBorder
        radius={0}
        w={width}
        maw="100%"
        h="75vh"
        display="flex"
        style={{ flexDirection: 'column' }}
      >
        <MessageList
          messages={messages}
          status="ready"
          contentWidth="100%"
          initialScrollBehavior="top"
          messageActions={actions}
          commands={COMMANDS}
        />
      </Paper>
      <RewindDialog
        opened={rewindTarget !== null}
        onClose={() => setRewindTarget(null)}
        messages={messages}
        defaultMessageId={rewindTarget ?? undefined}
        onRewind={async ({ messageId, mode }) => {
          await wait(700);
          setMessages((current) =>
            current.slice(
              0,
              current.findIndex((message) => message.id === messageId)
            )
          );
          setLog(`Rewound before ${messageId} (${mode})`);
        }}
      />
    </Stack>
  );
}

export function Usage() {
  return <FullCycle width={520} />;
}

export function Narrow() {
  return <FullCycle width={360} />;
}

export function Wide() {
  return <FullCycle width={900} />;
}
