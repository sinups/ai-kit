import React, { useRef, useState } from 'react';
import { Button, Group, Paper, Stack, Text } from '@mantine/core';
import type { ChatMessage, ChatStatus } from '../types';
import {
  feedConversation,
  longAnswer,
  longConversation,
  longUserText,
  planSummary,
} from './feed-fixtures';
import { MessageList } from './MessageList';

export default { title: 'MessageList/Feed' };

function Frame({
  width,
  children,
  controls,
}: {
  width: number;
  children: React.ReactNode;
  controls?: React.ReactNode;
}) {
  return (
    <Stack p="xl" gap="xs">
      <Group gap="xs">
        <Text size="xs" c="dimmed">
          {width}px
        </Text>
        {controls}
      </Group>
      <Paper
        withBorder
        radius={0}
        w={width}
        maw="100%"
        h="75vh"
        display="flex"
        style={{ flexDirection: 'column' }}
      >
        {children}
      </Paper>
    </Stack>
  );
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function TallBlock({ width }: { width: number }) {
  const [messages, setMessages] = useState<ChatMessage[]>(longConversation);
  const [status, setStatus] = useState<ChatStatus>('ready');
  const counter = useRef(0);

  const run = async () => {
    counter.current += 1;
    const n = counter.current;
    setMessages((current) => [
      ...current,
      { id: `u-plan-${n}`, role: 'user', parts: [{ type: 'text', text: 'Plan the retry' }] },
    ]);
    setStatus('streaming');
    await wait(500);
    setMessages((current) => [
      ...current,
      {
        id: `a-plan-${n}`,
        role: 'assistant',
        parts: [
          {
            type: 'tool-PlanWrite',
            toolCallId: `plan-${n}`,
            state: 'input-available',
            input: {
              plan: { id: `retry-${n}`, title: 'Retry token refresh', summary: planSummary },
            },
          },
        ],
      },
    ]);
    await wait(600);
    setMessages((current) => [
      ...current,
      {
        id: `a-answer-${n}`,
        role: 'assistant',
        parts: [{ type: 'text', text: longAnswer('Plan note', 3) }],
      },
    ]);
    setStatus('ready');
  };

  return (
    <Frame
      width={width}
      controls={
        <Button size="compact-xs" onClick={run}>
          Add plan card and answer
        </Button>
      }
    >
      <MessageList messages={messages} status={status} />
    </Frame>
  );
}

export function TallBlockNarrow() {
  return <TallBlock width={390} />;
}

export function TallBlockWide() {
  return <TallBlock width={900} />;
}

function NewMessages({ width }: { width: number }) {
  const [messages, setMessages] = useState<ChatMessage[]>(longConversation);
  const receive = () =>
    setMessages((current) => [
      ...current,
      ...[1, 2, 3].map((i) => ({
        id: `bg-${current.length}-${i}`,
        role: 'assistant' as const,
        parts: [{ type: 'text', text: `Background task ${i} finished.` }],
      })),
    ]);
  return (
    <Frame
      width={width}
      controls={
        <Button size="compact-xs" onClick={receive}>
          Receive 3 messages
        </Button>
      }
    >
      <MessageList messages={messages} status="ready" />
    </Frame>
  );
}

export function NewMessagesNarrow() {
  return <NewMessages width={360} />;
}

export function NewMessagesWide() {
  return <NewMessages width={900} />;
}

export function StickyPromptNarrow() {
  return (
    <Frame width={360}>
      <MessageList
        messages={longConversation}
        status="ready"
        stickyPrompt
        initialScrollBehavior="top"
      />
    </Frame>
  );
}

export function StickyPromptWide() {
  return (
    <Frame width={900}>
      <MessageList
        messages={longConversation}
        status="ready"
        stickyPrompt
        contentWidth={720}
        initialScrollBehavior="top"
      />
    </Frame>
  );
}

function Search({ width }: { width: number }) {
  const [opened, setOpened] = useState(true);
  return (
    <Frame
      width={width}
      controls={
        <Text size="xs" c="dimmed">
          Click inside the list and press Mod+F
        </Text>
      }
    >
      <MessageList
        messages={longConversation}
        status="ready"
        withSearch
        searchOpened={opened}
        onSearchOpenedChange={setOpened}
        initialScrollBehavior="top"
      />
    </Frame>
  );
}

export function SearchNarrow() {
  return <Search width={360} />;
}

export function SearchWide() {
  return <Search width={900} />;
}

export function FeedPartsNarrow() {
  return (
    <Frame width={360}>
      <MessageList messages={feedConversation} status="ready" initialScrollBehavior="top" />
    </Frame>
  );
}

export function FeedPartsWide() {
  return (
    <Frame width={900}>
      <MessageList messages={feedConversation} status="ready" initialScrollBehavior="top" />
    </Frame>
  );
}

export function LongUserMessage() {
  return (
    <Frame width={520}>
      <MessageList
        status="ready"
        initialScrollBehavior="top"
        longMessageThreshold
        messages={[
          { id: 'u1', role: 'user', parts: [{ type: 'text', text: longUserText }] },
          {
            id: 'a1',
            role: 'assistant',
            parts: [{ type: 'text', text: 'Every attempt reuses a revoked token.' }],
          },
        ]}
      />
    </Frame>
  );
}
