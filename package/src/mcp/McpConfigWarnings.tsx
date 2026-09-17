import React, { memo, useMemo } from 'react';
import { Badge, Button, Code, Group, Stack, Text } from '@mantine/core';
import { IconAlertTriangle, IconExternalLink, IconFileAlert } from '@tabler/icons-react';
import { groupConfigWarnings } from './mcp-import';
import classes from './Mcp.module.css';
import type { McpConfigWarning } from './types';
import { formatTemplate } from '../utils/format-template';

export type McpConfigWarningsLabels = {
  /** `{count}` is replaced with the number of warnings */
  title: string;
  openFile: string;
  kinds: Record<string, string>;
};

export const MCP_CONFIG_WARNINGS_LABELS: McpConfigWarningsLabels = {
  title: '{count} configuration warnings',
  openFile: 'Open file',
  kinds: {
    'duplicate-name': 'Duplicate name',
    'unknown-field': 'Unknown field',
    'invalid-value': 'Invalid value',
  },
};

export interface McpConfigWarningsProps {
  /** Warnings produced while reading MCP configuration files; nothing renders when empty, exact duplicates are shown once */
  warnings: McpConfigWarning[];
  /** Adds an "Open file" button to every file group */
  onOpenFile?: (file: string) => void;
  /** Title, button and warning kind overrides */
  labels?: Partial<McpConfigWarningsLabels>;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

/** Warnings from parsing MCP configuration, grouped by file with the field path and message */
export const McpConfigWarnings = memo(function McpConfigWarnings({
  warnings,
  onOpenFile,
  labels: labelsOverride,
  className,
  style,
}: McpConfigWarningsProps) {
  const labels = {
    ...MCP_CONFIG_WARNINGS_LABELS,
    ...labelsOverride,
    kinds: { ...MCP_CONFIG_WARNINGS_LABELS.kinds, ...labelsOverride?.kinds },
  };
  const groups = useMemo(() => groupConfigWarnings(warnings), [warnings]);
  const total = groups.reduce((sum, group) => sum + group.warnings.length, 0);

  if (total === 0) {
    return null;
  }

  return (
    <Stack gap="sm" className={className} style={style}>
      <Group gap={6} wrap="nowrap">
        <IconAlertTriangle size={16} className={classes.warningIcon} aria-hidden />
        <Text size="sm" fw={500} className={classes.warningTitle}>
          {formatTemplate(labels.title, { count: total })}
        </Text>
      </Group>
      {groups.map((group) => (
        <Stack
          key={group.file}
          gap="xs"
          component="section"
          aria-label={group.file}
          className={classes.warningGroup}
        >
          <Group justify="space-between" wrap="nowrap" gap="xs">
            <Group gap={6} wrap="nowrap" className={classes.header}>
              <IconFileAlert size={14} className={classes.warningFileIcon} aria-hidden />
              <Code className={classes.breakAll}>{group.file}</Code>
              <Badge size="xs" variant="light" color="yellow" circle={group.warnings.length < 10}>
                {group.warnings.length}
              </Badge>
            </Group>
            {onOpenFile && (
              <Button
                size="compact-xs"
                variant="subtle"
                color="gray"
                leftSection={<IconExternalLink size={12} />}
                onClick={() => onOpenFile(group.file)}
              >
                {labels.openFile}
              </Button>
            )}
          </Group>
          {group.warnings.map((warning, index) => (
            <Stack key={warning.id ?? `${warning.path ?? ''}:${warning.kind}:${index}`} gap={4}>
              <Group gap={6} wrap="wrap">
                <Badge size="xs" variant="light" color="yellow">
                  {labels.kinds[warning.kind] ?? warning.kind}
                </Badge>
                {warning.path && <Code className={classes.breakAll}>{warning.path}</Code>}
              </Group>
              <Text size="sm" c="dimmed">
                {warning.message}
              </Text>
            </Stack>
          ))}
        </Stack>
      ))}
    </Stack>
  );
});
