import React, { memo } from 'react';
import { Button, Code, Group, Stack, Text, Title } from '@mantine/core';
import { IconArrowLeft, IconPlayerPlay } from '@tabler/icons-react';
import { SchemaView } from '../primitives/SchemaView/SchemaView';
import { getMcpToolDisplayName } from './mcp-server';
import {
  MCP_TOOL_ANNOTATION_LABELS,
  McpToolAnnotationBadges,
  type McpToolAnnotationLabels,
} from './McpToolAnnotationBadges';
import type { McpToolDefinition } from './types';
import classes from './Mcp.module.css';

export type McpToolDetailLabels = {
  back: string;
  input: string;
  output: string;
  noInput: string;
  tryTool: string;
  annotations: McpToolAnnotationLabels;
};

export const MCP_TOOL_DETAIL_LABELS: McpToolDetailLabels = {
  back: 'Back',
  input: 'Input',
  output: 'Output',
  noInput: 'This tool takes no arguments',
  tryTool: 'Try tool',
  annotations: MCP_TOOL_ANNOTATION_LABELS,
};

export interface McpToolDetailProps {
  /** Tool definition from `tools/list` */
  tool: McpToolDefinition;
  /** Name of the server that provides the tool, shown above the tool name */
  serverName?: string;
  /** Renders a back button above the header */
  onBack?: () => void;
  /** Renders a "Try tool" button */
  onTry?: (tool: McpToolDefinition) => void;
  /** Heading and button overrides */
  labels?: Partial<McpToolDetailLabels>;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

/** MCP tool reference: description, behavior annotations and input/output schemas */
export const McpToolDetail = memo(function McpToolDetail({
  tool,
  serverName,
  onBack,
  onTry,
  labels: labelsOverride,
  className,
  style,
}: McpToolDetailProps) {
  const labels = { ...MCP_TOOL_DETAIL_LABELS, ...labelsOverride };
  const displayName = getMcpToolDisplayName(tool);

  return (
    <Stack gap="lg" className={className} style={style}>
      {onBack && (
        <Group>
          <Button
            variant="subtle"
            color="gray"
            size="compact-sm"
            leftSection={<IconArrowLeft size={16} />}
            onClick={onBack}
          >
            {serverName ? `${labels.back}: ${serverName}` : labels.back}
          </Button>
        </Group>
      )}

      <Stack gap="xs">
        <Group justify="space-between" align="flex-start" wrap="nowrap" gap="sm">
          <Stack gap={2} miw={0}>
            <Text component="h3" size="sm" fw={500}>
              {displayName}
            </Text>
            <Group gap={6} wrap="wrap">
              {serverName && (
                <Text size="xs" c="dimmed">
                  {serverName}
                </Text>
              )}
              {displayName !== tool.name && <Code>{tool.name}</Code>}
            </Group>
          </Stack>
          {onTry && (
            <Button
              size="xs"
              variant="light"
              leftSection={<IconPlayerPlay size={14} />}
              onClick={() => onTry(tool)}
            >
              {labels.tryTool}
            </Button>
          )}
        </Group>
        <McpToolAnnotationBadges
          annotations={tool.annotations}
          labels={labels.annotations}
          withTooltips
        />
        {tool.description && (
          <Text size="sm" className={classes.preWrap}>
            {tool.description}
          </Text>
        )}
      </Stack>

      <Stack gap="xs">
        <Title order={4}>{labels.input}</Title>
        <SchemaView schema={tool.inputSchema ?? { type: 'object' }} emptyLabel={labels.noInput} />
      </Stack>

      {tool.outputSchema && (
        <Stack gap="xs">
          <Title order={4}>{labels.output}</Title>
          <SchemaView schema={tool.outputSchema} />
        </Stack>
      )}
    </Stack>
  );
});
