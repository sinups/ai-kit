import React, { memo, useState } from 'react';
import { Alert, Badge, Box, Button, Checkbox, Group, Paper, Stack, Text } from '@mantine/core';
import { IconAlertCircle, IconCheck, IconX } from '@tabler/icons-react';
import { usePendingActions } from '../hooks/use-pending-actions';
import { EntityListItem } from '../primitives/EntityList/EntityListItem';
import { getMcpServerTarget } from './mcp-server';
import classes from './Mcp.module.css';
import { MCP_TRANSPORT_LABELS, McpTransportIcon } from './McpTransportIcon';
import type { McpDiscoveredServer, McpTransport } from './types';
import { fillTemplate } from '../utils/fill-template';

export type McpDiscoveredServersLabels = {
  /** `{count}` is replaced with the number of servers */
  title: string;
  description: string;
  selectAll: string;
  approve: string;
  reject: string;
  /** `{count}` is replaced with the number of selected servers */
  selected: string;
  error: string;
  dismiss: string;
  transports: Record<McpTransport, string>;
};

export const DEFAULT_MCP_DISCOVERED_SERVERS_LABELS: McpDiscoveredServersLabels = {
  title: 'Found {count} new MCP servers in this project',
  description: 'Project servers can run commands on your machine. Approve only the ones you trust.',
  selectAll: 'Select all',
  approve: 'Approve selected',
  reject: 'Reject',
  selected: '{count} selected',
  error: 'Could not save the decision',
  dismiss: 'Dismiss',
  transports: MCP_TRANSPORT_LABELS,
};

export interface McpDiscoveredServersProps {
  /** Servers found in project configuration that the user has not approved or rejected yet; nothing renders when empty */
  servers: McpDiscoveredServer[];
  /** Called with the selected servers; the buttons show a loader until the promise settles */
  onApprove: (servers: McpDiscoveredServer[]) => void | Promise<void>;
  /** Called with all listed servers, selected or not, to dismiss the prompt; the Reject button is hidden when omitted */
  onReject?: (servers: McpDiscoveredServer[]) => void | Promise<void>;
  /** Ids selected initially, all servers by default; servers added to the list later start selected */
  defaultSelectedIds?: string[];
  /** Button and message overrides */
  labels?: Partial<McpDiscoveredServersLabels>;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

/** Prompt that lists MCP servers found in project configuration and lets the user approve a selection or reject them */
export const McpDiscoveredServers = memo(function McpDiscoveredServers({
  servers,
  onApprove,
  onReject,
  defaultSelectedIds,
  labels: labelsOverride,
  className,
  style,
}: McpDiscoveredServersProps) {
  const labels = { ...DEFAULT_MCP_DISCOVERED_SERVERS_LABELS, ...labelsOverride };
  const action = usePendingActions(labels.error);
  const [deselected, setDeselected] = useState<ReadonlySet<string>>(
    () =>
      new Set(
        defaultSelectedIds
          ? servers.filter((server) => !defaultSelectedIds.includes(server.id)).map(({ id }) => id)
          : []
      )
  );
  const selectedServers = servers.filter((server) => !deselected.has(server.id));
  const selectedIds = selectedServers.map((server) => server.id);
  const pending = action.isPending('approve') || action.isPending('reject');

  if (servers.length === 0) {
    return null;
  }

  const allSelected = selectedIds.length === servers.length;
  const toggle = (id: string) =>
    setDeselected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });

  return (
    <Paper withBorder radius="md" p="sm" className={className} style={style}>
      <Stack gap="sm">
        <Stack gap={2}>
          <Text size="sm" fw={500}>
            {fillTemplate(labels.title, { count: servers.length })}
          </Text>
          <Text size="xs" c="dimmed">
            {labels.description}
          </Text>
        </Stack>

        {action.error && (
          <Alert
            color="red"
            variant="light"
            icon={<IconAlertCircle size={16} />}
            withCloseButton
            closeButtonLabel={labels.dismiss}
            onClose={() => action.clearError()}
          >
            {action.error}
          </Alert>
        )}

        <Checkbox
          size="xs"
          label={labels.selectAll}
          checked={allSelected}
          indeterminate={selectedIds.length > 0 && !allSelected}
          disabled={pending}
          onChange={() =>
            setDeselected(allSelected ? new Set(servers.map((server) => server.id)) : new Set())
          }
          px="sm"
        />

        <Stack
          gap={4}
          role="group"
          aria-label={fillTemplate(labels.title, { count: servers.length })}
        >
          {servers.map((server) => (
            <Group key={server.id} gap={0} wrap="nowrap" align="center">
              <Checkbox
                size="xs"
                px="sm"
                aria-label={server.name}
                checked={!deselected.has(server.id)}
                disabled={pending}
                onChange={() => toggle(server.id)}
              />
              <Box className={classes.header} flex={1}>
                <EntityListItem
                  title={server.name}
                  icon={<McpTransportIcon transport={server.transport} />}
                  badges={
                    <Badge size="xs" variant="light" color="gray">
                      {labels.transports[server.transport]}
                    </Badge>
                  }
                  description={
                    <>
                      <span>{getMcpServerTarget(server)}</span>
                      <br />
                      <span>{server.source}</span>
                    </>
                  }
                  descriptionLines={2}
                  disabled={pending}
                  onClick={() => toggle(server.id)}
                />
              </Box>
            </Group>
          ))}
        </Stack>

        <Group justify="space-between" wrap="nowrap" gap="xs">
          <Text size="xs" c="dimmed">
            {fillTemplate(labels.selected, { count: selectedIds.length })}
          </Text>
          <Group gap="xs" wrap="nowrap">
            {onReject && (
              <Button
                size="xs"
                variant="subtle"
                color="gray"
                leftSection={<IconX size={14} />}
                loading={action.isPending('reject')}
                disabled={pending && !action.isPending('reject')}
                onClick={() => action.run('reject', () => onReject(servers))}
              >
                {labels.reject}
              </Button>
            )}
            <Button
              size="xs"
              leftSection={<IconCheck size={14} />}
              loading={action.isPending('approve')}
              disabled={selectedIds.length === 0 || (pending && !action.isPending('approve'))}
              onClick={() => action.run('approve', () => onApprove(selectedServers))}
            >
              {labels.approve}
            </Button>
          </Group>
        </Group>
      </Stack>
    </Paper>
  );
});

McpDiscoveredServers.displayName = 'McpDiscoveredServers';
