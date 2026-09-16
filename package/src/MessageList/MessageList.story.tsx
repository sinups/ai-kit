import React from 'react';
import { Paper } from '@mantine/core';
import {
  conversation,
  errorConversation,
  pendingConversation,
  streamingConversation,
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
