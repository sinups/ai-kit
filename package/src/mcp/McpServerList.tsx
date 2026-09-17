import React, { memo, useMemo, useState } from 'react';
import { Alert, Button, Stack } from '@mantine/core';
import {
  IconAlertCircle,
  IconKey,
  IconPlayerPause,
  IconPlayerPlay,
  IconPlus,
  IconRefresh,
  IconServer,
  IconTrash,
} from '@tabler/icons-react';
import { usePendingActions } from '../hooks/use-pending-actions';
import { ConfirmDialog } from '../primitives/ConfirmDialog/ConfirmDialog';
import { EntityList } from '../primitives/EntityList/EntityList';
import { EntityListItem, type EntityListItemAction } from '../primitives/EntityList/EntityListItem';
import { StatusBadge } from '../primitives/StatusBadge/StatusBadge';
import {
  getMcpAgentUiStatus,
  getMcpServerFilterOptions,
  getMcpServerTarget,
  getMcpToolCount,
  matchesMcpServerFilter,
  matchesMcpServerQuery,
  MCP_SCOPE_LABELS,
  MCP_SCOPE_ORDER,
  MCP_STATUS_LABELS,
  type McpServerFilter,
} from './mcp-server';
import { McpTransportIcon } from './McpTransportIcon';
import type { McpServer, McpServerScope, McpServerStatus } from './types';
import { formatTemplate } from '../utils/format-template';

export type McpServerListLabels = {
  addServer: string;
  list: string;
  search: string;
  filter: string;
  noResults: string;
  emptyTitle: string;
  emptyDescription: string;
  retry: string;
  actions: string;
  reconnect: string;
  authenticate: string;
  enable: string;
  disable: string;
  remove: string;
  /** `{count}` is replaced with the number of tools */
  tools: string;
  error: string;
  dismiss: string;
  removeTitle: string;
  /** `{name}` is replaced with the server name */
  removeMessage: string;
  cancel: string;
  filterAll: string;
  filterConnected: string;
  filterAttention: string;
  filterDisabled: string;
  status: Record<McpServerStatus, string>;
  scope: Record<McpServerScope, string>;
};

export const MCP_SERVER_LIST_LABELS: McpServerListLabels = {
  addServer: 'Add server',
  list: 'MCP servers',
  search: 'Search servers',
  filter: 'Filter servers',
  noResults: 'No servers match',
  emptyTitle: 'No MCP servers',
  emptyDescription: 'Connect a server to give the agent new tools',
  retry: 'Retry',
  actions: 'Server actions',
  reconnect: 'Reconnect',
  authenticate: 'Authenticate',
  enable: 'Enable',
  disable: 'Disable',
  remove: 'Remove',
  tools: '{count} tools',
  error: 'Action failed',
  dismiss: 'Dismiss',
  removeTitle: 'Remove server',
  removeMessage: '{name} and its tools will no longer be available to the agent.',
  cancel: 'Cancel',
  filterAll: 'All',
  filterConnected: 'Connected',
  filterAttention: 'Needs attention',
  filterDisabled: 'Disabled',
  status: MCP_STATUS_LABELS,
  scope: MCP_SCOPE_LABELS,
};

const SERVER_ACTION_KEYS = ['authenticate', 'enable', 'reconnect', 'disable'];

type ServerAction = (server: McpServer) => void | Promise<void>;

export interface McpServerListProps {
  /** Configured servers */
  servers: McpServer[];
  /** Id of the highlighted server */
  selectedId?: string | null;
  /** Called when a server row is clicked */
  onSelect?: (server: McpServer) => void;
  /** Shows skeleton rows */
  loading?: boolean;
  /** Error message shown instead of the list */
  error?: React.ReactNode;
  /** Called by the retry button of the error */
  onRetry?: () => void;
  /** Renders the "Add server" button when set */
  onAdd?: () => void;
  /** Adds a "Reconnect" action to servers that are not disabled */
  onReconnect?: ServerAction;
  /** Adds an "Authenticate" action to servers that need auth */
  onAuthenticate?: ServerAction;
  /** Adds an "Enable" action to disabled servers */
  onEnable?: ServerAction;
  /** Adds a "Disable" action to enabled servers */
  onDisable?: ServerAction;
  /** Adds a "Remove" action that asks for confirmation first */
  onRemove?: ServerAction;
  /** Groups servers by scope when they use more than one, `true` by default */
  groupByScope?: boolean;
  /** Shows the search input, `true` by default */
  withSearch?: boolean;
  /** Shows the status and scope filter, `true` by default */
  withFilter?: boolean;
  /** Button and message overrides */
  labels?: Partial<McpServerListLabels>;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

function getFilterLabel(value: McpServerFilter, labels: McpServerListLabels): string {
  if (value.startsWith('scope:')) {
    return labels.scope[value.slice('scope:'.length) as McpServerScope];
  }
  const map: Record<string, string> = {
    all: labels.filterAll,
    connected: labels.filterConnected,
    attention: labels.filterAttention,
    disabled: labels.filterDisabled,
  };
  return map[value];
}

/** Searchable list of MCP servers with status, scope groups and per-server actions */
export const McpServerList = memo(function McpServerList({
  servers,
  selectedId,
  onSelect,
  loading,
  error,
  onRetry,
  onAdd,
  onReconnect,
  onAuthenticate,
  onEnable,
  onDisable,
  onRemove,
  groupByScope = true,
  withSearch = true,
  withFilter = true,
  labels: labelsOverride,
  className,
  style,
}: McpServerListProps) {
  const labels = { ...MCP_SERVER_LIST_LABELS, ...labelsOverride };
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const action = usePendingActions(labels.error);
  const [removeTarget, setRemoveTarget] = useState<McpServer | null>(null);

  const filterOptions = useMemo(() => getMcpServerFilterOptions(servers), [servers]);
  const scopes = new Set(servers.map((server) => server.scope ?? 'user'));
  const scopeGroupOrder = MCP_SCOPE_ORDER.map((scope) => labels.scope[scope]);
  const activeFilter = filterOptions.some((option) => option.value === filter) ? filter : 'all';

  const getActions = (server: McpServer): EntityListItemAction[] => {
    const items: EntityListItemAction[] = [];
    const add = (
      key: string,
      label: string,
      icon: React.ReactNode,
      callback: ServerAction | undefined,
      color?: string
    ) => {
      if (callback) {
        items.push({
          label,
          icon,
          color,
          disabled: SERVER_ACTION_KEYS.some((name) => action.isPending(`${name}:${server.id}`)),
          onClick: () => action.run(`${key}:${server.id}`, () => callback(server)),
        });
      }
    };
    if (server.status === 'needs-auth') {
      add('authenticate', labels.authenticate, <IconKey size={14} />, onAuthenticate);
    }
    if (server.status === 'disabled') {
      add('enable', labels.enable, <IconPlayerPlay size={14} />, onEnable);
    } else {
      add('reconnect', labels.reconnect, <IconRefresh size={14} />, onReconnect);
      add('disable', labels.disable, <IconPlayerPause size={14} />, onDisable);
    }
    if (onRemove) {
      items.push({
        label: labels.remove,
        icon: <IconTrash size={14} />,
        color: 'red',
        onClick: () => setRemoveTarget(server),
      });
    }
    return items;
  };

  return (
    <Stack gap="sm" className={className} style={style}>
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
      <EntityList<McpServer>
        items={servers}
        getId={(server) => server.id}
        selectedId={selectedId}
        onSelect={onSelect}
        loading={loading}
        error={error}
        onRetry={onRetry}
        retryLabel={labels.retry}
        ariaLabel={labels.list}
        noResults={labels.noResults}
        empty={{
          title: labels.emptyTitle,
          description: labels.emptyDescription,
          icon: <IconServer />,
          action: onAdd ? (
            <Button size="xs" leftSection={<IconPlus size={14} />} onClick={onAdd}>
              {labels.addServer}
            </Button>
          ) : undefined,
        }}
        search={
          withSearch && servers.length > 0
            ? {
                value: query,
                onChange: setQuery,
                placeholder: labels.search,
                filter: matchesMcpServerQuery,
              }
            : undefined
        }
        filters={
          withFilter && servers.length > 0
            ? {
                value: activeFilter,
                onChange: setFilter,
                label: labels.filter,
                filter: matchesMcpServerFilter,
                options: filterOptions.map((option) => ({
                  value: option.value,
                  label: getFilterLabel(option.value, labels),
                  count: option.count,
                })),
              }
            : undefined
        }
        groupBy={
          groupByScope && scopes.size > 1
            ? (server) => labels.scope[server.scope ?? 'user']
            : undefined
        }
        groupOrder={scopeGroupOrder}
        toolbar={
          onAdd && servers.length > 0 ? (
            <Button size="sm" variant="light" leftSection={<IconPlus size={14} />} onClick={onAdd}>
              {labels.addServer}
            </Button>
          ) : undefined
        }
        renderItem={(server, { selected }) => {
          const toolCount = getMcpToolCount(server);
          return (
            <EntityListItem
              title={server.name}
              icon={<McpTransportIcon transport={server.transport} />}
              status={
                <StatusBadge
                  status={getMcpAgentUiStatus(server.status)}
                  label={labels.status[server.status]}
                  size="xs"
                />
              }
              description={
                server.status === 'error' && server.error
                  ? server.error
                  : getMcpServerTarget(server)
              }
              descriptionLines={1}
              meta={
                toolCount !== undefined && server.status !== 'disabled'
                  ? formatTemplate(labels.tools, { count: toolCount })
                  : undefined
              }
              actions={getActions(server)}
              actionsLabel={`${labels.actions}: ${server.name}`}
              selected={selected}
            />
          );
        }}
      />
      {onRemove && (
        <ConfirmDialog
          opened={removeTarget !== null}
          danger
          title={labels.removeTitle}
          message={
            removeTarget ? formatTemplate(labels.removeMessage, { name: removeTarget.name }) : null
          }
          confirmLabel={labels.remove}
          cancelLabel={labels.cancel}
          errorLabel={labels.error}
          onConfirm={() => (removeTarget ? onRemove(removeTarget) : undefined)}
          onClose={() => setRemoveTarget(null)}
        />
      )}
    </Stack>
  );
});
