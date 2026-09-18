'use client';

import {
  ActionIcon,
  Badge,
  Box,
  Drawer,
  Group,
  Switch,
  Text,
  Tooltip,
  useMantineColorScheme,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IconLayoutSidebarRight, IconMoon, IconSun } from '@tabler/icons-react';
import {
  AgentChat,
  AgentStatus,
  ContextUsage,
  type CustomToolRendererProps,
  type McpServer,
  McpTransportIcon,
  type PermissionRule,
} from '@sinups/ai-kit';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { StatusResponse } from '@/lib/events';
import { useAgentChat } from '@/lib/use-agent-chat';
import { Inspector } from './inspector';
import { ApprovalContext, McpToolCard } from './mcp-tool-card';

const FILE_SUGGESTIONS = [
  { id: 'list', label: 'What files are in the data folder?' },
  { id: 'notes', label: 'Summarise release-notes.md' },
  { id: 'search', label: 'Which file mentions onboarding?' },
];

const SERVER_SUGGESTIONS = [
  { id: 'tools', label: 'What can you do with this server?' },
  { id: 'overview', label: 'Give me an overview of what is in there.' },
];

export default function Page() {
  const {
    messages,
    status,
    error,
    send,
    stop,
    approvals,
    decide,
    permissions,
    updatePermissions,
    usage,
    startedAt,
    tools,
  } = useAgentChat();
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const [serverStatus, setServerStatus] = useState<StatusResponse | null>(null);
  const [server, setServer] = useState<McpServer | null>(null);
  const [loadingServer, setLoadingServer] = useState(true);
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const wide = useMediaQuery('(min-width: 1100px)');

  const loadServer = useCallback(async (refresh = false) => {
    setLoadingServer(true);
    try {
      const response = await fetch(`/api/server${refresh ? '?refresh' : ''}`);
      setServer((await response.json()) as McpServer);
    } finally {
      setLoadingServer(false);
    }
  }, []);

  useEffect(() => {
    fetch('/api/status')
      .then((response) => response.json() as Promise<StatusResponse>)
      .then(setServerStatus)
      .catch(() => {});
    void loadServer();
  }, [loadServer]);

  const definitions = useMemo(
    () => Object.fromEntries((server?.tools ?? []).map((tool) => [tool.name, tool])),
    [server]
  );

  const panelServer = useMemo(() => {
    if (!server?.tools) {
      return server;
    }
    return {
      ...server,
      tools: server.tools.map((tool) => ({
        ...tool,
        annotations: tool.annotations?.destructiveHint
          ? { destructiveHint: true }
          : tool.annotations?.readOnlyHint
            ? { readOnlyHint: true }
            : undefined,
      })),
    };
  }, [server]);

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

  const transport = serverStatus?.transport ?? 'stdio';
  const onFiles = transport !== 'http';
  const suggestions = onFiles ? FILE_SUGGESTIONS : SERVER_SUGGESTIONS;
  const working = status === 'submitted' || status === 'streaming';

  const approvalValue = useMemo(
    () => ({
      approvals,
      decide,
      serverName: serverStatus?.server ?? 'mcp',
      definitions,
    }),
    [approvals, decide, serverStatus?.server, definitions]
  );

  const awaitingApproval = useMemo(
    () => Object.values(approvals).some((approval) => !approval.outcome),
    [approvals]
  );

  const statusBar = working ? (
    <AgentStatus
      label={awaitingApproval ? 'Waiting for your decision' : 'Working'}
      startedAt={startedAt ?? undefined}
      tokens={usage?.tokens}
      paused={awaitingApproval}
      onStop={stop}
    />
  ) : undefined;

  const reconnect = useCallback(() => void loadServer(true), [loadServer]);
  const saveRule = useCallback(
    (rule: PermissionRule) => void updatePermissions({ save: rule }),
    [updatePermissions]
  );
  const removeRule = useCallback(
    (rule: PermissionRule) => void updatePermissions({ remove: rule.id }),
    [updatePermissions]
  );

  const inspector = useMemo(
    () => (
      <Inspector
        server={panelServer}
        loading={loadingServer}
        rules={permissions.rules}
        onReconnect={reconnect}
        onSaveRule={saveRule}
        onDeleteRule={removeRule}
      />
    ),
    [panelServer, loadingServer, permissions.rules, reconnect, saveRule, removeRule]
  );

  return (
    <ApprovalContext value={approvalValue}>
      <Box h="100dvh" display="flex" style={{ flexDirection: 'column' }}>
        <Group justify="space-between" px="md" py="xs">
          <Group gap="xs">
            <Text fw={600} size="sm">
              Chat over MCP
            </Text>
            {serverStatus && (
              <Tooltip label={serverStatus.target}>
                <Badge
                  variant="light"
                  leftSection={<McpTransportIcon transport={transport} size={12} />}
                >
                  {serverStatus.server}
                </Badge>
              </Tooltip>
            )}
            {tools.length > 0 && <Badge variant="default">{tools.length} tools</Badge>}
            {serverStatus && <Badge variant="default">{serverStatus.model}</Badge>}
          </Group>
          <Group gap="sm">
            {usage && (
              <ContextUsage used={usage.contextTokens} total={usage.contextWindow} withLabel />
            )}
            <Switch
              size="xs"
              label="Auto-approve"
              checked={permissions.auto}
              onChange={(event) => void updatePermissions({ auto: event.currentTarget.checked })}
            />
            <ActionIcon
              variant="default"
              onClick={() => setInspectorOpen((open) => !open)}
              aria-label="Toggle inspector"
            >
              <IconLayoutSidebarRight size={18} />
            </ActionIcon>
            <ActionIcon variant="default" onClick={toggleColorScheme} aria-label="Toggle theme">
              {colorScheme === 'dark' ? <IconSun size={18} /> : <IconMoon size={18} />}
            </ActionIcon>
          </Group>
        </Group>

        <Group align="stretch" gap={0} style={{ flex: 1, minHeight: 0 }} wrap="nowrap">
          <Box style={{ flex: 1, minWidth: 0 }}>
            <AgentChat
              messages={messages}
              status={status}
              error={error}
              onSend={send}
              onStop={stop}
              toolRenderers={toolRenderers}
              statusBar={statusBar}
              suggestions={suggestions}
              contentWidth={760}
              emptyStatePosition="center"
              emptySuggestionsPlacement="empty"
              emptyState={{
                layout: 'center',
                title: onFiles
                  ? 'Ask about the data folder'
                  : `Ask the ${serverStatus?.server ?? 'MCP'} server`,
                description: 'Answers come from an MCP server, every call needs your approval.',
              }}
            />
          </Box>
          {wide && inspectorOpen && (
            <Box w={400} style={{ borderLeft: '1px solid var(--mantine-color-default-border)' }}>
              {inspector}
            </Box>
          )}
        </Group>

        <Drawer
          opened={!wide && inspectorOpen}
          onClose={() => setInspectorOpen(false)}
          position="bottom"
          size="70%"
          title="MCP server"
        >
          {inspector}
        </Drawer>
      </Box>
    </ApprovalContext>
  );
}
