'use client';

import { Alert, Box, NavLink, ScrollArea, Stack, Text } from '@mantine/core';
import {
  type ChatInspectorPanel,
  type McpServer,
  McpServerDetail,
  McpTransportIcon,
  type PermissionRule,
  PermissionRulesPanel,
} from '@sinups/ai-kit';
import { memo, useMemo, useState } from 'react';
import type { Messages } from './i18n/en';

export type InspectorProps = {
  messages: Messages;
  servers: McpServer[];
  loading: boolean;
  rules: PermissionRule[];
  onReconnect: () => void;
  onSaveRule: (rule: PermissionRule) => Promise<void>;
  onDeleteRule: (rule: PermissionRule) => Promise<void>;
};

export function useInspectorPanels({
  messages,
  servers,
  loading,
  rules,
  onReconnect,
  onSaveRule,
  onDeleteRule,
}: InspectorProps): ChatInspectorPanel[] {
  return useMemo(
    () => [
      {
        id: 'servers',
        label: messages.inspector.servers,
        content: (
          <ServersPanel
            messages={messages}
            servers={servers}
            loading={loading}
            onReconnect={onReconnect}
          />
        ),
      },
      {
        id: 'permissions',
        label: messages.inspector.rules,
        content: (
          <ScrollArea style={{ flex: 1, minHeight: 0 }}>
            <Box p="sm">
              <PermissionRulesPanel
                rules={rules}
                knownTools={knownToolNames(servers)}
                onSaveRule={onSaveRule}
                onDeleteRule={onDeleteRule}
                labels={messages.kit?.rulesPanel}
              />
            </Box>
          </ScrollArea>
        ),
      },
    ],
    [messages, servers, loading, rules, onReconnect, onSaveRule, onDeleteRule]
  );
}

function knownToolNames(servers: McpServer[]) {
  return servers.flatMap((server) =>
    (server.tools ?? []).map((tool) => `mcp__${server.name}__${tool.name}`)
  );
}

const ServersPanel = memo(function ServersPanel({
  messages,
  servers,
  loading,
  onReconnect,
}: Pick<InspectorProps, 'messages' | 'servers' | 'loading' | 'onReconnect'>) {
  const [selected, setSelected] = useState<string | null>(null);
  const active = servers.find((server) => server.id === selected) ?? servers[0];

  return (
    <ScrollArea style={{ flex: 1, minHeight: 0 }}>
      <Stack gap="sm" p="sm">
        {servers.length > 1 && (
          <Stack gap={2}>
            {servers.map((server) => (
              <NavLink
                key={server.id}
                active={server.id === active?.id}
                onClick={() => setSelected(server.id)}
                leftSection={<McpTransportIcon transport={server.transport} size={14} />}
                label={server.name}
                description={
                  server.status === 'connected'
                    ? messages.inspector.toolCount(server.toolCount ?? 0)
                    : messages.inspector.status[server.status]
                }
                fz="sm"
              />
            ))}
          </Stack>
        )}
        {servers.length === 0 && !loading && (
          <Text size="sm" c="dimmed">
            {messages.inspector.noServers}
          </Text>
        )}
        {active?.status === 'error' && (
          <Alert
            color="red"
            variant="light"
            title={messages.inspector.serverUnavailable(active.name)}
          >
            {active.error}
          </Alert>
        )}
        {active && (
          <McpServerDetail
            server={active}
            loading={loading}
            onReconnect={onReconnect}
            labels={messages.kit?.serverDetail}
          />
        )}
      </Stack>
    </ScrollArea>
  );
});
