import React, { memo } from 'react';
import { Alert, Badge, Button, Code, DataList, Group, Stack, Text, Title } from '@mantine/core';
import { useElementSize } from '@mantine/hooks';
import { IconAlertCircle } from '@tabler/icons-react';
import { usePendingActions } from '../../hooks/use-pending-actions';
import { ContextUsage, type ContextUsageSegment } from '../../ContextUsage/ContextUsage';
import type { AgentUiStatus } from '../../primitives/StatusBadge/status-meta';
import { StatusBadge } from '../../primitives/StatusBadge/StatusBadge';
import { formatTokens } from '../../utils/format-tokens';
import { countMcpStatuses } from '../status-panel';
import type { StatusAction, StatusMcpServer, StatusMemoryFile } from '../types';
import classes from './StatusPanel.module.css';

export interface StatusPanelLabels {
  title: string;
  version: string;
  model: string;
  account: string;
  organization: string;
  cwd: string;
  mcpServers: string;
  memory: string;
  context: string;
  none: string;
  mcpStatus: Record<AgentUiStatus, string>;
  tokens: (value: string) => string;
  contextValue: (used: string, total: string) => string;
  actionError: string;
}

export const DEFAULT_STATUS_PANEL_LABELS: StatusPanelLabels = {
  title: 'Status',
  version: 'Version',
  model: 'Model',
  account: 'Account',
  organization: 'Organization',
  cwd: 'Working directory',
  mcpServers: 'MCP servers',
  memory: 'Memory',
  context: 'Context',
  none: 'None',
  mcpStatus: {
    success: 'connected',
    running: 'connecting',
    pending: 'pending',
    'needs-auth': 'need auth',
    warning: 'warning',
    error: 'failed',
    disabled: 'disabled',
    idle: 'idle',
  },
  tokens: (value) => `${value} tokens`,
  contextValue: (used, total) => `${used} / ${total} tokens`,
  actionError: 'Action failed',
};

export interface StatusPanelProps {
  /** Agent or app version */
  version?: string;
  /** Name of the active model */
  model?: React.ReactNode;
  /** Signed-in account */
  account?: { email?: string; name?: string; plan?: string };
  /** Organization of the account */
  organization?: string;
  /** Working directory of the session */
  cwd?: string;
  /** MCP servers, summarized as counters per status */
  mcpServers?: StatusMcpServer[];
  /** Memory files loaded into the context */
  memoryFiles?: StatusMemoryFile[];
  /** Context window usage */
  context?: {
    used: number;
    total: number;
    segments?: ContextUsageSegment[];
    onCompact?: () => void;
  };
  /** Extra rows appended after the built-in ones */
  items?: { label: React.ReactNode; value: React.ReactNode }[];
  /** Buttons under the summary, for example `Doctor` or `Log out` */
  actions?: StatusAction[];
  /** Shows the heading, `true` by default */
  withTitle?: boolean;
  /** Overrides of the default English labels */
  labels?: Partial<StatusPanelLabels>;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

/** Environment summary: version, model, account, working directory, MCP servers, memory and context usage */
export const StatusPanel = memo(function StatusPanel({
  version,
  model,
  account,
  organization,
  cwd,
  mcpServers,
  memoryFiles,
  context,
  items = [],
  actions = [],
  withTitle = true,
  labels: labelsProp,
  className,
  style,
}: StatusPanelProps) {
  const labels = {
    ...DEFAULT_STATUS_PANEL_LABELS,
    ...labelsProp,
    mcpStatus: { ...DEFAULT_STATUS_PANEL_LABELS.mcpStatus, ...labelsProp?.mcpStatus },
  };
  const { ref, width } = useElementSize();
  const pending = usePendingActions(labels.actionError);

  const rows: { key: string; label: React.ReactNode; value: React.ReactNode }[] = [];
  if (version) {
    rows.push({ key: 'version', label: labels.version, value: <Code>{version}</Code> });
  }
  if (model) {
    rows.push({ key: 'model', label: labels.model, value: model });
  }
  if (account) {
    rows.push({
      key: 'account',
      label: labels.account,
      value: (
        <Group gap="xs" wrap="wrap">
          <Text inherit truncate="end" miw={0}>
            {account.email ?? account.name}
          </Text>
          {account.plan && (
            <Badge size="xs" variant="light">
              {account.plan}
            </Badge>
          )}
        </Group>
      ),
    });
  }
  if (organization) {
    rows.push({ key: 'organization', label: labels.organization, value: organization });
  }
  if (cwd) {
    rows.push({
      key: 'cwd',
      label: labels.cwd,
      value: (
        <Code title={cwd} className={classes.path}>
          {cwd}
        </Code>
      ),
    });
  }
  if (mcpServers) {
    const counts = countMcpStatuses(mcpServers);
    rows.push({
      key: 'mcp',
      label: labels.mcpServers,
      value:
        counts.length === 0 ? (
          <Text size="sm" c="dimmed">
            {labels.none}
          </Text>
        ) : (
          <Group gap={6} wrap="wrap">
            {counts.map(({ status, count }) => (
              <StatusBadge
                key={status}
                status={status}
                withIcon={status !== 'running' && status !== 'pending'}
                label={`${count} ${labels.mcpStatus[status]}`}
              />
            ))}
          </Group>
        ),
    });
  }
  if (memoryFiles) {
    rows.push({
      key: 'memory',
      label: labels.memory,
      value:
        memoryFiles.length === 0 ? (
          <Text size="sm" c="dimmed">
            {labels.none}
          </Text>
        ) : (
          <Stack gap={4}>
            {memoryFiles.map((file) => (
              <Group key={file.path} gap="xs" wrap="wrap">
                <Code className={classes.path}>{file.path}</Code>
                {file.tokens !== undefined && (
                  <Text size="xs" c="dimmed">
                    {labels.tokens(formatTokens(file.tokens))}
                  </Text>
                )}
              </Group>
            ))}
          </Stack>
        ),
    });
  }
  if (context) {
    rows.push({
      key: 'context',
      label: labels.context,
      value: (
        <Group gap="xs" wrap="nowrap">
          <ContextUsage
            used={context.used}
            total={context.total}
            segments={context.segments}
            onCompact={context.onCompact}
            withLabel
          />
          <Text size="xs" c="dimmed">
            {labels.contextValue(formatTokens(context.used), formatTokens(context.total))}
          </Text>
        </Group>
      ),
    });
  }
  items.forEach((item, index) => rows.push({ key: `item-${index}`, ...item }));

  const anyPending = actions.some((action) => pending.isPending(action.label));

  return (
    <Stack ref={ref} gap="md" className={className} style={style}>
      {withTitle && (
        <Title order={3} size="h5">
          {labels.title}
        </Title>
      )}
      <DataList
        orientation={width > 0 && width < 400 ? 'vertical' : 'horizontal'}
        labelWidth="160px"
      >
        {rows.map((row) => (
          <DataList.Item key={row.key}>
            <DataList.ItemLabel>{row.label}</DataList.ItemLabel>
            <DataList.ItemValue>{row.value}</DataList.ItemValue>
          </DataList.Item>
        ))}
      </DataList>
      {pending.error && (
        <Alert color="red" variant="light" icon={<IconAlertCircle size={16} />}>
          {pending.error}
        </Alert>
      )}
      {actions.length > 0 && (
        <Group gap="xs">
          {actions.map((action) => (
            <Button
              key={action.label}
              size="xs"
              variant="default"
              leftSection={action.icon}
              loading={pending.isPending(action.label)}
              disabled={anyPending && !pending.isPending(action.label)}
              onClick={() => pending.run(action.label, action.onClick)}
            >
              {action.label}
            </Button>
          ))}
        </Group>
      )}
    </Stack>
  );
});

StatusPanel.displayName = 'StatusPanel';
