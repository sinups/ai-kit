'use client';

import { ScrollArea, Stack, Tabs } from '@mantine/core';
import { memo } from 'react';
import {
  McpServerDetail,
  type McpServer,
  type PermissionRule,
  PermissionRulesPanel,
} from '@sinups/ai-kit';

export type InspectorProps = {
  server: McpServer | null;
  loading: boolean;
  rules: PermissionRule[];
  onReconnect: () => void;
  onSaveRule: (rule: PermissionRule) => void;
  onDeleteRule: (rule: PermissionRule) => void;
};

export const Inspector = memo(function Inspector({
  server,
  loading,
  rules,
  onReconnect,
  onSaveRule,
  onDeleteRule,
}: InspectorProps) {
  return (
    <Tabs defaultValue="server" h="100%" style={{ display: 'flex', flexDirection: 'column' }}>
      <Tabs.List>
        <Tabs.Tab value="server">Server</Tabs.Tab>
        <Tabs.Tab value="permissions">Permissions</Tabs.Tab>
      </Tabs.List>
      <ScrollArea style={{ flex: 1, minHeight: 0 }}>
        <Tabs.Panel value="server" p="sm">
          {server && (
            <McpServerDetail server={server} loading={loading} onReconnect={onReconnect} />
          )}
        </Tabs.Panel>
        <Tabs.Panel value="permissions" p="sm">
          <Stack gap="sm">
            <PermissionRulesPanel
              rules={rules}
              knownTools={server?.tools?.map((tool) => `mcp__${server.name}__${tool.name}`)}
              onSaveRule={onSaveRule}
              onDeleteRule={onDeleteRule}
            />
          </Stack>
        </Tabs.Panel>
      </ScrollArea>
    </Tabs>
  );
});
