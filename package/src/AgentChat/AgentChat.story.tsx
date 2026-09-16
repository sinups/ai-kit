import React, { useCallback, useRef, useState } from 'react';
import { Paper } from '@mantine/core';
import type { ChatMessage, ChatStatus } from '../types';
import { conversation } from '../MessageList/fixtures';
import { AgentChat } from './AgentChat';

export default { title: 'AgentChat' };

const REPLY = `Here is what I found:

- The refresh call lives in \`src/auth/session.ts\`
- Errors were **not** retried before

\`\`\`ts
const token = await withRetry(() => api.refresh(session.refreshToken), { retries: 3 });
\`\`\`

Let me know if you want a regression test as well.`;

const SUGGESTIONS = [
  { id: 's1', label: 'Explain this repo', value: 'Explain what this repository does.' },
  { id: 's2', label: 'Find TODOs', value: 'List all TODO comments in src.' },
  { id: 's3', label: 'Run tests', value: 'Run the test suite and summarize failures.' },
];

function useLocalChat(initial: ChatMessage[]) {
  const [messages, setMessages] = useState<ChatMessage[]>(initial);
  const [status, setStatus] = useState<ChatStatus>('ready');
  const timerRef = useRef<number | null>(null);

  const onSend = useCallback((message: { role: 'user'; content: string }) => {
    const id = `${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id: `u-${id}`,
        role: 'user',
        createdAt: new Date(),
        parts: [{ type: 'text', text: message.content }],
      },
    ]);
    setStatus('submitted');
    timerRef.current = window.setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { id: `a-${id}`, role: 'assistant', parts: [{ type: 'text', text: REPLY }] },
      ]);
      setStatus('ready');
      timerRef.current = null;
    }, 1200);
  }, []);

  const onStop = useCallback(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setStatus('ready');
  }, []);

  return { messages, status, onSend, onStop };
}

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <Paper withBorder radius={0} style={{ height: '85vh', maxWidth: 560, margin: '0 auto' }}>
      {children}
    </Paper>
  );
}

export function Usage() {
  const chat = useLocalChat(conversation);
  return (
    <Frame>
      <AgentChat {...chat} suggestions={SUGGESTIONS} />
    </Frame>
  );
}

export function EmptyCentered() {
  const chat = useLocalChat([]);
  return (
    <Frame>
      <AgentChat
        {...chat}
        emptyStatePosition="center"
        emptySuggestionsPlacement="empty"
        suggestions={SUGGESTIONS}
      />
    </Frame>
  );
}

export function EmptyCenteredSuggestionsBottom() {
  const chat = useLocalChat([]);
  return (
    <Frame>
      <AgentChat
        {...chat}
        emptyStatePosition="center"
        emptySuggestionsPlacement="both"
        emptySuggestionsPosition="bottom"
        suggestions={SUGGESTIONS}
      />
    </Frame>
  );
}

export function WithError() {
  const chat = useLocalChat(conversation.slice(0, 1));
  return (
    <Frame>
      <AgentChat {...chat} status="error" error={new Error('Upstream model timed out after 60s')} />
    </Frame>
  );
}
