'use client';

import { ActionIcon, Badge, Box, Group, Text, Tooltip, useMantineColorScheme } from '@mantine/core';
import { IconMoon, IconSun } from '@tabler/icons-react';
import { AgentChat, type CustomToolRendererProps } from '@sinups/ai-kit';
import { useEffect, useMemo, useState } from 'react';
import type { StatusResponse } from '@/lib/events';
import { useAgentChat } from '@/lib/use-agent-chat';
import { ApprovalContext, McpToolCard } from './mcp-tool-card';

const SUGGESTIONS = [
  { id: 'list', label: 'What files are in the data folder?' },
  { id: 'notes', label: 'Summarise release-notes.md' },
  { id: 'search', label: 'Which file mentions onboarding?' },
];

function ServerBar({ status, tools }: { status: StatusResponse | null; tools: number }) {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();

  return (
    <Group justify="space-between" px="md" py="xs">
      <Group gap="xs">
        <Text fw={600} size="sm">
          Chat over MCP
        </Text>
        {status && (
          <Tooltip label={status.target}>
            <Badge variant="light">{status.server}</Badge>
          </Tooltip>
        )}
        {tools > 0 && <Badge variant="default">{tools} tools</Badge>}
        {status && <Badge variant="default">{status.model}</Badge>}
      </Group>
      <ActionIcon variant="default" onClick={toggleColorScheme} aria-label="Toggle color scheme">
        {colorScheme === 'dark' ? <IconSun size={18} /> : <IconMoon size={18} />}
      </ActionIcon>
    </Group>
  );
}

export default function Page() {
  const { messages, status, error, send, stop, approvals, decide, tools } = useAgentChat();
  const [serverStatus, setServerStatus] = useState<StatusResponse | null>(null);

  useEffect(() => {
    let active = true;
    fetch('/api/status')
      .then((response) => response.json() as Promise<StatusResponse>)
      .then((body) => {
        if (active) {
          setServerStatus(body);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const toolTypes = useMemo(() => {
    const types = new Set<string>();
    for (const message of messages) {
      for (const part of message.parts) {
        if (part.type.startsWith('tool-mcp__')) {
          types.add(part.type);
        }
      }
    }
    return [...types].sort().join('|');
  }, [messages]);

  const toolRenderers = useMemo(
    () =>
      Object.fromEntries(
        (toolTypes ? toolTypes.split('|') : []).map((type) => [
          type,
          McpToolCard as React.ComponentType<CustomToolRendererProps>,
        ])
      ),
    [toolTypes]
  );

  return (
    <ApprovalContext value={{ approvals, decide }}>
      <Box h="100dvh" display="flex" style={{ flexDirection: 'column' }}>
        <ServerBar status={serverStatus} tools={tools.length} />
        <Box style={{ flex: 1, minHeight: 0 }}>
          <AgentChat
            messages={messages}
            status={status}
            error={error}
            onSend={send}
            onStop={stop}
            toolRenderers={toolRenderers}
            suggestions={SUGGESTIONS}
            contentWidth={760}
            emptyStatePosition="center"
            emptySuggestionsPlacement="empty"
            emptyState={{
              layout: 'center',
              title: 'Ask about the data folder',
              description: 'Answers come from an MCP server, every call needs your approval.',
            }}
          />
        </Box>
      </Box>
    </ApprovalContext>
  );
}
