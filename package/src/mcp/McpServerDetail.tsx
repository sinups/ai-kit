import React, { memo, useState } from 'react';
import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Code,
  DataList,
  EmptyState,
  Group,
  Skeleton,
  Stack,
  Tabs,
  Text,
  Tooltip,
} from '@mantine/core';
import { useElementSize } from '@mantine/hooks';
import {
  IconAlertCircle,
  IconEdit,
  IconEye,
  IconEyeOff,
  IconFileText,
  IconKey,
  IconLock,
  IconMessage,
  IconPlayerPause,
  IconPlayerPlay,
  IconRefresh,
  IconTool,
  IconTrash,
} from '@tabler/icons-react';
import { usePendingActions } from '../hooks/use-pending-actions';
import { ConfirmDialog } from '../primitives/ConfirmDialog/ConfirmDialog';
import { EntityList } from '../primitives/EntityList/EntityList';
import { EntityListItem } from '../primitives/EntityList/EntityListItem';
import type { KeyValuePair } from '../primitives/KeyValueEditor/key-value';
import { StatusBadge } from '../primitives/StatusBadge/StatusBadge';
import {
  formatMcpPromptArguments,
  getMcpAgentUiStatus,
  getMcpToolCount,
  getMcpToolDisplayName,
  MCP_SCOPE_LABELS,
  MCP_STATUS_LABELS,
  matchesMcpToolQuery,
} from './mcp-server';
import classes from './Mcp.module.css';
import {
  DEFAULT_MCP_TOOL_ANNOTATION_LABELS,
  McpToolAnnotationBadges,
  type McpToolAnnotationLabels,
} from './McpToolAnnotationBadges';
import { MCP_TRANSPORT_LABELS, McpTransportIcon } from './McpTransportIcon';
import type {
  McpServer,
  McpServerScope,
  McpServerStatus,
  McpToolDefinition,
  McpTransport,
} from './types';
import { formatTemplate } from '../utils/format-template';

export type McpServerDetailTab = 'tools' | 'resources' | 'prompts' | 'configuration';

export type McpServerDetailLabels = {
  reconnect: string;
  authenticate: string;
  enable: string;
  disable: string;
  edit: string;
  remove: string;
  tools: string;
  resources: string;
  prompts: string;
  configuration: string;
  searchTools: string;
  noTools: string;
  noResources: string;
  noPrompts: string;
  /** Shown instead of lists while the server is not connected */
  notConnected: string;
  /** Shown instead of lists while the server needs authentication */
  notAuthenticated: string;
  /** Shown instead of lists while the server is disabled */
  notEnabled: string;
  connectionFailed: string;
  needsAuth: string;
  actionFailed: string;
  dismiss: string;
  removeTitle: string;
  /** `{name}` is replaced with the server name */
  removeMessage: string;
  cancel: string;
  version: string;
  transport: string;
  scope: string;
  command: string;
  arguments: string;
  url: string;
  environment: string;
  headers: string;
  capabilities: string;
  instructions: string;
  showValue: string;
  hideValue: string;
  /** Prefix of prompt arguments */
  promptArguments: string;
  status: Record<McpServerStatus, string>;
  scopes: Record<McpServerScope, string>;
  transports: Record<McpTransport, string>;
  annotations: McpToolAnnotationLabels;
};

export const DEFAULT_MCP_SERVER_DETAIL_LABELS: McpServerDetailLabels = {
  reconnect: 'Reconnect',
  authenticate: 'Authenticate',
  enable: 'Enable',
  disable: 'Disable',
  edit: 'Edit',
  remove: 'Remove',
  tools: 'Tools',
  resources: 'Resources',
  prompts: 'Prompts',
  configuration: 'Configuration',
  searchTools: 'Search tools',
  noTools: 'No tools',
  noResources: 'No resources',
  noPrompts: 'No prompts',
  notConnected: 'Connect the server to load what it provides',
  notAuthenticated: 'Available after you sign in',
  notEnabled: 'Enable the server to load what it provides',
  connectionFailed: 'Connection failed',
  needsAuth: 'Sign in to this server to use its tools',
  actionFailed: 'Action failed',
  dismiss: 'Dismiss',
  removeTitle: 'Remove server',
  removeMessage: '{name} and its tools will no longer be available to the agent.',
  cancel: 'Cancel',
  version: 'Version',
  transport: 'Transport',
  scope: 'Scope',
  command: 'Command',
  arguments: 'Arguments',
  url: 'URL',
  environment: 'Environment',
  headers: 'Headers',
  capabilities: 'Capabilities',
  instructions: 'Instructions',
  showValue: 'Show value',
  hideValue: 'Hide value',
  promptArguments: 'Arguments',
  status: MCP_STATUS_LABELS,
  scopes: MCP_SCOPE_LABELS,
  transports: MCP_TRANSPORT_LABELS,
  annotations: DEFAULT_MCP_TOOL_ANNOTATION_LABELS,
};

type ServerAction = (server: McpServer) => void | Promise<void>;

export interface McpServerDetailProps {
  /** Server to show */
  server: McpServer;
  /** Shows skeletons instead of tools, resources and prompts */
  loading?: boolean;
  /** Controlled active tab */
  tab?: McpServerDetailTab;
  /** Called when the user switches tabs */
  onTabChange?: (tab: McpServerDetailTab) => void;
  /** Called when a tool row is clicked */
  onSelectTool?: (tool: McpToolDefinition) => void;
  /** Renders the "Reconnect" button for servers that are not disabled */
  onReconnect?: ServerAction;
  /** Renders the "Authenticate" button for servers that need auth */
  onAuthenticate?: ServerAction;
  /** Renders the "Enable" button for disabled servers */
  onEnable?: ServerAction;
  /** Renders the "Disable" button for enabled servers */
  onDisable?: ServerAction;
  /** Renders the "Edit" button in the configuration tab */
  onEdit?: (server: McpServer) => void;
  /** Renders the "Remove" button in the configuration tab, the removal is confirmed in a dialog */
  onRemove?: ServerAction;
  /** Button, tab and field overrides */
  labels?: Partial<McpServerDetailLabels>;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

const MASK = '••••••••';
const WIDE_WIDTH = 480;

function PairsValue({ pairs, labels }: { pairs: KeyValuePair[]; labels: McpServerDetailLabels }) {
  const [revealed, setRevealed] = useState<ReadonlySet<string>>(new Set());
  const toggle = (id: string) =>
    setRevealed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });

  return (
    <Stack gap={4}>
      {pairs.map((pair) => {
        const hidden = pair.secret && !revealed.has(pair.id);
        const toggleLabel = `${hidden ? labels.showValue : labels.hideValue}: ${pair.key}`;
        return (
          <Group key={pair.id} gap={6} wrap="nowrap" align="center">
            <Code>{pair.key}</Code>
            <Text size="sm" ff="monospace" className={classes.breakAll}>
              {hidden ? MASK : pair.value}
            </Text>
            {pair.secret && (
              <Tooltip label={toggleLabel}>
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color="gray"
                  aria-label={toggleLabel}
                  onClick={() => toggle(pair.id)}
                >
                  {hidden ? <IconEye size={14} /> : <IconEyeOff size={14} />}
                </ActionIcon>
              </Tooltip>
            )}
          </Group>
        );
      })}
    </Stack>
  );
}

function ListSkeleton() {
  return (
    <Stack gap="sm" aria-busy="true">
      {[0, 1, 2].map((index) => (
        <Stack key={index} gap={6}>
          <Skeleton height={10} width="40%" radius="sm" />
          <Skeleton height={8} width="80%" radius="sm" />
        </Stack>
      ))}
    </Stack>
  );
}

/** One MCP server: status and actions, its tools, resources and prompts, and its configuration */
export const McpServerDetail = memo(function McpServerDetail({
  server,
  loading = false,
  tab,
  onTabChange,
  onSelectTool,
  onReconnect,
  onAuthenticate,
  onEnable,
  onDisable,
  onEdit,
  onRemove,
  labels: labelsOverride,
  className,
  style,
}: McpServerDetailProps) {
  const labels = { ...DEFAULT_MCP_SERVER_DETAIL_LABELS, ...labelsOverride };
  const { ref, width } = useElementSize();
  const [uncontrolledTab, setUncontrolledTab] = useState<McpServerDetailTab>('tools');
  const [toolQuery, setToolQuery] = useState('');
  const action = usePendingActions(labels.actionFailed);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const anyPending = ['authenticate', 'reconnect', 'enable', 'disable'].some(action.isPending);
  const activeTab = tab ?? uncontrolledTab;
  const isCompact = width > 0 && width < WIDE_WIDTH;
  const isDisabled = server.status === 'disabled';
  const isConnected = server.status === 'connected';
  const tools = server.tools ?? [];
  const toolsPending = !server.tools && isConnected && (server.toolCount ?? 0) > 0;
  const resources = server.resources ?? [];
  const prompts = server.prompts ?? [];
  const pairs = server.transport === 'stdio' ? server.env : server.headers;
  const capabilities = Object.entries(server.capabilities ?? {})
    .filter(([, enabled]) => enabled)
    .map(([name]) => name);

  const setTab = (value: string | null) => {
    if (!value) {
      return;
    }
    setUncontrolledTab(value as McpServerDetailTab);
    onTabChange?.(value as McpServerDetailTab);
  };

  const actionButton = (
    key: string,
    label: string,
    icon: React.ReactNode,
    callback: ServerAction | undefined,
    variant: 'filled' | 'default' | 'light' = 'default',
    color?: string
  ) =>
    callback ? (
      <Button
        key={key}
        size="xs"
        variant={variant}
        color={color}
        leftSection={icon}
        loading={action.isPending(key)}
        disabled={anyPending && !action.isPending(key)}
        onClick={() => action.run(key, () => callback(server))}
      >
        {label}
      </Button>
    ) : null;

  const notLoadedLabel =
    server.status === 'needs-auth'
      ? labels.notAuthenticated
      : isDisabled
        ? labels.notEnabled
        : labels.notConnected;

  const notLoaded = (empty: string) => (
    <EmptyState
      size="sm"
      py="lg"
      description={isConnected ? empty : notLoadedLabel}
      icon={isDisabled ? <IconPlayerPause /> : undefined}
    />
  );

  const count = (value: number | undefined) =>
    loading || value === undefined ? undefined : (
      <Badge size="xs" variant="light" color="gray" circle={value < 10}>
        {value}
      </Badge>
    );

  return (
    <Stack ref={ref} gap="md" className={className} style={style}>
      <Group justify="space-between" align="flex-start" gap="sm">
        <Stack gap={4} className={classes.header}>
          <Group gap="xs" wrap="wrap">
            <Text component="h2" size="sm" fw={500} className={classes.breakAll}>
              {server.name}
            </Text>
            <StatusBadge
              status={getMcpAgentUiStatus(server.status)}
              label={labels.status[server.status]}
            />
          </Group>
          <Group gap="xs" wrap="wrap">
            <Badge
              size="sm"
              variant="light"
              color="gray"
              leftSection={<McpTransportIcon transport={server.transport} size={12} />}
            >
              {labels.transports[server.transport]}
            </Badge>
            {server.scope && (
              <Badge size="sm" variant="light" color="gray">
                {labels.scopes[server.scope]}
              </Badge>
            )}
            {server.version && (
              <Text size="xs" c="dimmed">
                {labels.version} {server.version}
              </Text>
            )}
          </Group>
        </Stack>
        <Group gap="xs" wrap="wrap">
          {server.status === 'needs-auth' &&
            actionButton(
              'authenticate',
              labels.authenticate,
              <IconKey size={14} />,
              onAuthenticate,
              'filled'
            )}
          {!isDisabled &&
            actionButton('reconnect', labels.reconnect, <IconRefresh size={14} />, onReconnect)}
          {isDisabled
            ? actionButton(
                'enable',
                labels.enable,
                <IconPlayerPlay size={14} />,
                onEnable,
                'filled'
              )
            : actionButton('disable', labels.disable, <IconPlayerPause size={14} />, onDisable)}
        </Group>
      </Group>

      {server.status === 'error' && (
        <Alert
          color="red"
          variant="light"
          title={labels.connectionFailed}
          icon={<IconAlertCircle size={16} />}
        >
          {server.error && (
            <Text size="sm" ff="monospace" className={classes.breakAll}>
              {server.error}
            </Text>
          )}
        </Alert>
      )}
      {server.status === 'needs-auth' && (
        <Alert color="orange" variant="light" icon={<IconLock size={16} />}>
          {labels.needsAuth}
        </Alert>
      )}
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

      <Tabs
        value={activeTab}
        onChange={setTab}
        keepMounted={false}
        classNames={{ list: classes.tabsList, tab: classes.tab }}
      >
        <Tabs.List>
          <Tabs.Tab
            value="tools"
            leftSection={isCompact ? undefined : <IconTool size={14} />}
            rightSection={count(server.tools ? tools.length : getMcpToolCount(server))}
          >
            {labels.tools}
          </Tabs.Tab>
          <Tabs.Tab
            value="resources"
            leftSection={isCompact ? undefined : <IconFileText size={14} />}
            rightSection={count(server.resources?.length)}
          >
            {labels.resources}
          </Tabs.Tab>
          <Tabs.Tab
            value="prompts"
            leftSection={isCompact ? undefined : <IconMessage size={14} />}
            rightSection={count(server.prompts?.length)}
          >
            {labels.prompts}
          </Tabs.Tab>
          <Tabs.Tab value="configuration">{labels.configuration}</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="tools" pt="md">
          {loading || toolsPending ? (
            <ListSkeleton />
          ) : tools.length === 0 ? (
            notLoaded(labels.noTools)
          ) : (
            <EntityList<McpToolDefinition>
              items={tools}
              getId={(tool) => tool.name}
              onSelect={onSelectTool}
              ariaLabel={labels.tools}
              search={
                tools.length > 5
                  ? {
                      value: toolQuery,
                      onChange: setToolQuery,
                      placeholder: labels.searchTools,
                      filter: matchesMcpToolQuery,
                    }
                  : undefined
              }
              renderItem={(tool) => (
                <EntityListItem
                  title={getMcpToolDisplayName(tool)}
                  titleLines={2}
                  description={tool.description}
                  icon={<IconTool size={16} />}
                  badges={
                    <McpToolAnnotationBadges
                      annotations={tool.annotations}
                      labels={labels.annotations}
                    />
                  }
                />
              )}
            />
          )}
        </Tabs.Panel>

        <Tabs.Panel value="resources" pt="md">
          {loading ? (
            <ListSkeleton />
          ) : resources.length === 0 ? (
            notLoaded(labels.noResources)
          ) : (
            <Stack gap={4}>
              {resources.map((resource) => (
                <EntityListItem
                  key={resource.uri}
                  title={resource.name}
                  description={resource.description ?? resource.uri}
                  icon={<IconFileText size={16} />}
                  meta={resource.mimeType}
                />
              ))}
            </Stack>
          )}
        </Tabs.Panel>

        <Tabs.Panel value="prompts" pt="md">
          {loading ? (
            <ListSkeleton />
          ) : prompts.length === 0 ? (
            notLoaded(labels.noPrompts)
          ) : (
            <Stack gap={4}>
              {prompts.map((prompt) => (
                <EntityListItem
                  key={prompt.name}
                  title={prompt.name}
                  icon={<IconMessage size={16} />}
                  descriptionLines={3}
                  description={
                    <>
                      {prompt.description}
                      {prompt.arguments && prompt.arguments.length > 0 && (
                        <>
                          {prompt.description && <br />}
                          {labels.promptArguments}: {formatMcpPromptArguments(prompt.arguments)}
                        </>
                      )}
                    </>
                  }
                />
              ))}
            </Stack>
          )}
        </Tabs.Panel>

        <Tabs.Panel value="configuration" pt="md">
          <Stack gap="md">
            <DataList size="sm" withDivider orientation={isCompact ? 'vertical' : 'horizontal'}>
              <DataList.Item>
                <DataList.ItemLabel>{labels.transport}</DataList.ItemLabel>
                <DataList.ItemValue>{labels.transports[server.transport]}</DataList.ItemValue>
              </DataList.Item>
              {server.scope && (
                <DataList.Item>
                  <DataList.ItemLabel>{labels.scope}</DataList.ItemLabel>
                  <DataList.ItemValue>{labels.scopes[server.scope]}</DataList.ItemValue>
                </DataList.Item>
              )}
              {server.transport === 'stdio' ? (
                <>
                  <DataList.Item>
                    <DataList.ItemLabel>{labels.command}</DataList.ItemLabel>
                    <DataList.ItemValue>
                      <Code className={classes.breakAll}>{server.command}</Code>
                    </DataList.ItemValue>
                  </DataList.Item>
                  {server.args && server.args.length > 0 && (
                    <DataList.Item>
                      <DataList.ItemLabel>{labels.arguments}</DataList.ItemLabel>
                      <DataList.ItemValue>
                        <Group gap={4} wrap="wrap">
                          {server.args.map((arg, index) => (
                            <Code key={`${index}-${arg}`} className={classes.breakAll}>
                              {arg}
                            </Code>
                          ))}
                        </Group>
                      </DataList.ItemValue>
                    </DataList.Item>
                  )}
                </>
              ) : (
                <DataList.Item>
                  <DataList.ItemLabel>{labels.url}</DataList.ItemLabel>
                  <DataList.ItemValue>
                    <Code className={classes.breakAll}>{server.url}</Code>
                  </DataList.ItemValue>
                </DataList.Item>
              )}
              {pairs && pairs.length > 0 && (
                <DataList.Item>
                  <DataList.ItemLabel>
                    {server.transport === 'stdio' ? labels.environment : labels.headers}
                  </DataList.ItemLabel>
                  <DataList.ItemValue>
                    <PairsValue pairs={pairs} labels={labels} />
                  </DataList.ItemValue>
                </DataList.Item>
              )}
              {capabilities.length > 0 && (
                <DataList.Item>
                  <DataList.ItemLabel>{labels.capabilities}</DataList.ItemLabel>
                  <DataList.ItemValue>
                    <Group gap={4} wrap="wrap">
                      {capabilities.map((name) => (
                        <Badge key={name} size="xs" variant="light" color="gray">
                          {name}
                        </Badge>
                      ))}
                    </Group>
                  </DataList.ItemValue>
                </DataList.Item>
              )}
              {server.instructions && (
                <DataList.Item>
                  <DataList.ItemLabel>{labels.instructions}</DataList.ItemLabel>
                  <DataList.ItemValue>
                    <Text size="sm" className={classes.preWrap}>
                      {server.instructions}
                    </Text>
                  </DataList.ItemValue>
                </DataList.Item>
              )}
            </DataList>
            {(onEdit || onRemove) && (
              <Group gap="xs">
                {onEdit && (
                  <Button
                    size="xs"
                    variant="default"
                    leftSection={<IconEdit size={14} />}
                    onClick={() => onEdit(server)}
                  >
                    {labels.edit}
                  </Button>
                )}
                {onRemove && (
                  <Button
                    size="xs"
                    variant="subtle"
                    color="red"
                    leftSection={<IconTrash size={14} />}
                    onClick={() => setConfirmRemove(true)}
                  >
                    {labels.remove}
                  </Button>
                )}
              </Group>
            )}
          </Stack>
        </Tabs.Panel>
      </Tabs>
      {onRemove && (
        <ConfirmDialog
          opened={confirmRemove}
          danger
          title={labels.removeTitle}
          message={formatTemplate(labels.removeMessage, { name: server.name })}
          labels={{ confirm: labels.remove, cancel: labels.cancel, error: labels.actionFailed }}
          onConfirm={() => onRemove(server)}
          onClose={() => setConfirmRemove(false)}
        />
      )}
    </Stack>
  );
});

McpServerDetail.displayName = 'McpServerDetail';
