import React, { useCallback, useRef, useState } from 'react';
import { Box, Paper, Stack, Text } from '@mantine/core';
import {
  IconBug,
  IconFileText,
  IconGitPullRequest,
  IconSparkles,
  IconTestPipe,
} from '@tabler/icons-react';
import type { ChatMessage, ChatStatus } from '../types';
import { conversation, toolRunConversation } from '../MessageList/fixtures';
import { AgentChat } from './AgentChat';

export default { title: 'Chat/AgentChat' };

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

export function WithError() {
  const chat = useLocalChat(conversation.slice(0, 1));
  return (
    <Frame>
      <AgentChat {...chat} status="error" error={new Error('Upstream model timed out after 60s')} />
    </Frame>
  );
}

export function FullPage() {
  const chat = useLocalChat([...toolRunConversation, ...conversation]);
  return (
    <Paper withBorder radius={0} h="95vh">
      <AgentChat {...chat} contentWidth={760} collapseToolRuns suggestions={SUGGESTIONS} />
    </Paper>
  );
}

export function FullWidth() {
  const chat = useLocalChat(conversation);
  return (
    <Paper withBorder radius={0} h="95vh">
      <AgentChat {...chat} contentWidth="100%" />
    </Paper>
  );
}

const WELCOME_ACTIONS = [
  {
    id: 'review',
    label: 'Review my pull request',
    value: 'Review the changes in my current branch.',
    icon: <IconGitPullRequest />,
    badge: 'New',
  },
  {
    id: 'bug',
    label: 'Find the cause of a bug',
    value: 'Help me find why ',
    icon: <IconBug />,
  },
  {
    id: 'tests',
    label: 'Write tests for a file',
    value: 'Write tests for ',
    icon: <IconTestPipe />,
  },
  {
    id: 'docs',
    label: 'Explain this repository',
    value: 'Explain what this repository does.',
    icon: <IconFileText />,
  },
];

function WelcomeChat({ width, withInfoBar }: { width: number | string; withInfoBar?: boolean }) {
  const chat = useLocalChat([]);
  const [infoBarOpen, setInfoBarOpen] = useState(true);
  return (
    <AgentChat
      {...chat}
      contentWidth={width}
      alignComposer
      hideSuggestionsWhenNotEmpty
      emptyState={{
        avatar: <IconSparkles size={22} />,
        title: 'How can I help you today?',
        description: 'Ask about the code, fix a bug or plan a change.',
        actions: WELCOME_ACTIONS,
      }}
      inputBarProps={
        withInfoBar && infoBarOpen
          ? {
              infoBar: {
                title: 'Qwen 2.5 Coder 32B is available',
                description: 'Switch models in settings',
                onClose: () => setInfoBarOpen(false),
              },
            }
          : undefined
      }
    />
  );
}

export function Welcome() {
  return (
    <Stack p="xl" gap="xs">
      <Text size="xs" c="dimmed">
        760px column
      </Text>
      <Paper withBorder radius={0} h="85vh">
        <WelcomeChat width={760} withInfoBar />
      </Paper>
    </Stack>
  );
}

Welcome.parameters = { docs: { source: { type: 'code' } } };

export function WelcomeNarrow() {
  return (
    <Stack p="xl" gap="xs">
      <Text size="xs" c="dimmed">
        390px
      </Text>
      <Paper withBorder radius={0} h="85vh" w={390}>
        <WelcomeChat width="100%" />
      </Paper>
    </Stack>
  );
}

WelcomeNarrow.parameters = { docs: { source: { type: 'code' } } };

export function WelcomeInWidget() {
  return (
    <Box p="xl">
      <Paper withBorder radius="lg" shadow="md" w={380} h={620} style={{ overflow: 'hidden' }}>
        <WelcomeChat width="100%" withInfoBar />
      </Paper>
    </Box>
  );
}

WelcomeInWidget.parameters = { docs: { source: { type: 'code' } } };
