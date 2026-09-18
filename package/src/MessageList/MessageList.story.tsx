import React from 'react';
import { Button, Paper, Stack } from '@mantine/core';
import type { ChatMessage } from '../types';
import { AgentStatus } from '../AgentStatus/AgentStatus';
import {
  compactedConversation,
  conversation,
  errorConversation,
  pendingConversation,
  streamingConversation,
  toolRunConversation,
} from './fixtures';
import { MessageList } from './MessageList';

export default { title: 'MessageList' };

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <Paper
      withBorder
      radius={0}
      style={{
        height: '80vh',
        maxWidth: 520,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {children}
    </Paper>
  );
}

export function Usage() {
  return (
    <Frame>
      <MessageList messages={conversation} status="ready" initialScrollBehavior="top" />
    </Frame>
  );
}

export function Streaming() {
  return (
    <Frame>
      <MessageList messages={streamingConversation} status="streaming" />
    </Frame>
  );
}

export function Pending() {
  return (
    <Frame>
      <MessageList messages={pendingConversation} status="submitted" />
    </Frame>
  );
}

export function WithError() {
  return (
    <Frame>
      <MessageList messages={errorConversation} status="error" />
    </Frame>
  );
}

export function WithoutCopyToolbar() {
  return (
    <Frame>
      <MessageList
        messages={conversation}
        status="ready"
        showCopyToolbar={false}
        initialScrollBehavior="top"
      />
    </Frame>
  );
}

function WidthFrame({ width, children }: { width: number; children: React.ReactNode }) {
  return (
    <Paper
      withBorder
      radius={0}
      style={{ height: '80vh', width, margin: '0 auto', display: 'flex', flexDirection: 'column' }}
    >
      {children}
    </Paper>
  );
}

export function CollapsedToolRunsNarrow() {
  return (
    <WidthFrame width={360}>
      <MessageList
        messages={toolRunConversation}
        status="ready"
        collapseToolRuns
        initialScrollBehavior="top"
      />
    </WidthFrame>
  );
}

export function CollapsedToolRunsWide() {
  return (
    <WidthFrame width={900}>
      <MessageList
        messages={toolRunConversation}
        status="ready"
        collapseToolRuns
        initialScrollBehavior="top"
      />
    </WidthFrame>
  );
}

export function CollapsedToolRunStreaming() {
  const [first] = toolRunConversation;
  const assistant = toolRunConversation[1];
  const parts = assistant.parts
    .slice(0, 4)
    .map((part, index) => (index === 3 ? { ...part, state: 'input-available' } : part));
  return (
    <WidthFrame width={520}>
      <MessageList
        messages={[first, { ...assistant, parts }]}
        status="streaming"
        collapseToolRuns
      />
    </WidthFrame>
  );
}

export function CompactionNarrow() {
  return (
    <WidthFrame width={360}>
      <MessageList messages={compactedConversation} status="ready" initialScrollBehavior="top" />
    </WidthFrame>
  );
}

export function CompactionWide() {
  return (
    <WidthFrame width={900}>
      <MessageList messages={compactedConversation} status="ready" initialScrollBehavior="top" />
    </WidthFrame>
  );
}

export function AnimatedAppearance() {
  const [messages, setMessages] = React.useState<ChatMessage[]>(conversation);
  const send = () => {
    const turn = messages.length;
    setMessages((current) => [
      ...current,
      {
        id: `appear-u${turn}`,
        role: 'user',
        parts: [{ type: 'text', text: `And what about step ${turn}?` }],
      },
      {
        id: `appear-a${turn}`,
        role: 'assistant',
        parts: [
          { type: 'text', text: 'Here is the next part of the answer, faded in on arrival.' },
        ],
      },
    ]);
  };

  return (
    <Stack gap="sm" align="center">
      <Frame>
        <MessageList messages={messages} status="ready" animateAppearance />
      </Frame>
      <Button onClick={send}>Add a turn</Button>
    </Stack>
  );
}

const betweenCalls: ChatMessage[] = [
  {
    id: 'u1',
    role: 'user',
    parts: [{ type: 'text', text: 'Find the overdue tasks and open one task with the list.' }],
  },
  {
    id: 'a1',
    role: 'assistant',
    parts: [
      { type: 'text', text: 'Looking at the workspace first.' },
      {
        type: 'tool-mcp__tracker__task_list',
        toolCallId: 'w1',
        state: 'output-available',
        input: { overdue: true },
        output: '3 overdue tasks',
      },
    ],
  },
];

export function WorkingRow() {
  return (
    <Frame>
      <MessageList messages={betweenCalls} status="streaming" workingRow />
    </Frame>
  );
}

export function WorkingRowOfTheHost() {
  return (
    <Frame>
      <MessageList
        messages={betweenCalls}
        status="streaming"
        workingRow={
          <AgentStatus label="Reading tasks" startedAt={Date.now() - 44_000} tokens={1840} paused />
        }
      />
    </Frame>
  );
}

WorkingRow.parameters = { visual: { skip: true } };
WorkingRowOfTheHost.parameters = { visual: { skip: true } };
