'use client';

import { Alert, NavLink, ScrollArea, Stack, Tabs, Text } from '@mantine/core';
import {
  type McpServer,
  McpServerDetail,
  McpTransportIcon,
  type PermissionRule,
  PermissionRulesPanel,
} from '@sinups/ai-kit';
import { memo, useState } from 'react';

export type InspectorProps = {
  servers: McpServer[];
  loading: boolean;
  rules: PermissionRule[];
  onReconnect: () => void;
  onSaveRule: (rule: PermissionRule) => void;
  onDeleteRule: (rule: PermissionRule) => void;
};

export const Inspector = memo(function Inspector({
  servers,
  loading,
  rules,
  onReconnect,
  onSaveRule,
  onDeleteRule,
}: InspectorProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const active = servers.find((server) => server.id === selected) ?? servers[0];
  const knownTools = servers.flatMap((server) =>
    (server.tools ?? []).map((tool) => `mcp__${server.name}__${tool.name}`)
  );

  return (
    <Tabs defaultValue="servers" h="100%" style={{ display: 'flex', flexDirection: 'column' }}>
      <Tabs.List>
        <Tabs.Tab value="servers">Servers</Tabs.Tab>
        <Tabs.Tab value="permissions">Permissions</Tabs.Tab>
      </Tabs.List>
      <ScrollArea style={{ flex: 1, minHeight: 0 }}>
        <Tabs.Panel value="servers" p="sm">
          <Stack gap="sm">
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
                        ? `${server.toolCount ?? 0} tools`
                        : server.status
                    }
                    fz="sm"
                  />
                ))}
              </Stack>
            )}
            {servers.length === 0 && !loading && (
              <Text size="sm" c="dimmed">
                No MCP servers configured.
              </Text>
            )}
            {active?.status === 'error' && (
              <Alert color="red" variant="light" title={`${active.name} is not reachable`}>
                {active.error}
              </Alert>
            )}
            {active && (
              <McpServerDetail server={active} loading={loading} onReconnect={onReconnect} />
            )}
          </Stack>
        </Tabs.Panel>
        <Tabs.Panel value="permissions" p="sm">
          <PermissionRulesPanel
            rules={rules}
            knownTools={knownTools}
            onSaveRule={onSaveRule}
            onDeleteRule={onDeleteRule}
          />
        </Tabs.Panel>
      </ScrollArea>
    </Tabs>
  );
});
