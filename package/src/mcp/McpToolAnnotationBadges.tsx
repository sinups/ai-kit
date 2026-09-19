import React, { memo } from 'react';
import { Badge, Group, Tooltip } from '@mantine/core';
import { getMcpToolAnnotationKinds, type McpToolAnnotationKind } from './mcp-server';
import type { McpToolAnnotations } from './types';

export type McpToolAnnotationLabels = Record<
  McpToolAnnotationKind,
  { label: string; description: string }
>;

export const DEFAULT_MCP_TOOL_ANNOTATION_LABELS: McpToolAnnotationLabels = {
  'read-only': { label: 'read-only', description: 'The server says it does not modify anything' },
  destructive: { label: 'destructive', description: 'May delete or overwrite data' },
  idempotent: { label: 'idempotent', description: 'Repeating a call has no extra effect' },
  'open-world': { label: 'open world', description: 'May reach external systems' },
};

const COLORS: Record<McpToolAnnotationKind, string> = {
  'read-only': 'teal',
  destructive: 'red',
  idempotent: 'gray',
  'open-world': 'blue',
};

export interface McpToolAnnotationBadgesProps {
  /** Tool annotations from the MCP server; missing hints take the defaults of the MCP specification */
  annotations?: McpToolAnnotations;
  /** Badge labels and tooltip descriptions per annotation kind */
  labels?: McpToolAnnotationLabels;
  /** Shows the description of each badge in a tooltip, `false` by default */
  withTooltips?: boolean;
}

export const McpToolAnnotationBadges = memo(function McpToolAnnotationBadges({
  annotations,
  labels = DEFAULT_MCP_TOOL_ANNOTATION_LABELS,
  withTooltips = false,
}: McpToolAnnotationBadgesProps) {
  const kinds = getMcpToolAnnotationKinds(annotations);
  if (kinds.length === 0) {
    return null;
  }
  return (
    <Group gap={4} wrap="wrap">
      {kinds.map((kind) => {
        const badge = (
          <Badge key={kind} size="xs" variant="light" color={COLORS[kind]} data-annotation={kind}>
            {labels[kind].label}
          </Badge>
        );
        return withTooltips ? (
          <Tooltip key={kind} label={labels[kind].description}>
            {badge}
          </Tooltip>
        ) : (
          badge
        );
      })}
    </Group>
  );
});

McpToolAnnotationBadges.displayName = 'McpToolAnnotationBadges';
