'use client';

import { Alert, Badge, Group, Stack, Text } from '@mantine/core';
import {
  type CustomToolRendererProps,
  McpTool,
  McpToolAnnotationBadges,
  type McpToolDefinition,
  McpTransportIcon,
  parseMcpToolType,
  ToolApprovalFooter,
} from '@sinups/ai-kit';
import { createContext, use } from 'react';
import type { ApprovalChoice } from '@/lib/events';
import type { ApprovalState } from '@/lib/use-agent-chat';
import classes from './mcp-tool-card.module.css';

type ApprovalContextValue = {
  approvals: Record<string, ApprovalState>;
  decide: (requestId: string, choice: ApprovalChoice) => void;
  transport: 'stdio' | 'http' | 'sse';
  serverName: string;
  definitions: Record<string, McpToolDefinition>;
};

export const ApprovalContext = createContext<ApprovalContextValue>({
  approvals: {},
  decide: () => {},
  transport: 'stdio',
  serverName: 'mcp',
  definitions: {},
});

const OUTCOME_LABELS = {
  once: 'Allowed once',
  session: 'Allowed',
  always: 'Allowed',
  deny: 'Denied',
  auto: 'Auto',
  rule: 'By rule',
} as const;

const OUTCOME_COLORS = {
  once: 'green',
  session: 'green',
  always: 'green',
  deny: 'red',
  auto: 'blue',
  rule: 'blue',
} as const;

const APPROVE_OPTIONS = [
  { value: 'once', label: 'Allow once', description: 'Ask again next time' },
  { value: 'session', label: 'Allow for this chat', description: 'Until the chat is reset' },
];

function countItems(value: unknown, depth = 3): number | null {
  if (Array.isArray(value)) {
    return value.length;
  }
  if (depth > 0 && value && typeof value === 'object') {
    for (const entry of Object.values(value)) {
      const found = countItems(entry, depth - 1);
      if (found !== null) {
        return found;
      }
    }
  }
  return null;
}

function summarize(output: unknown): string | null {
  if (output === undefined || output === null) {
    return null;
  }
  const text = typeof output === 'string' ? output : JSON.stringify(output);
  if (!text) {
    return null;
  }
  const items = countItems(output);
  const size =
    text.length >= 1024 ? `${Math.round(text.length / 1024)} KB` : `${text.length} chars`;
  if (items !== null) {
    return `${items} ${items === 1 ? 'item' : 'items'} · ${size}`;
  }
  const firstLine = typeof output === 'string' ? output.trim().split('\n')[0] : '';
  return firstLine ? `${firstLine.slice(0, 80)} · ${size}` : size;
}

export function McpToolCard({ part, output, status }: CustomToolRendererProps) {
  const { approvals, decide, transport, serverName, definitions } = use(ApprovalContext);
  const mcpInfo = parseMcpToolType(part.type);
  const approval = part.toolCallId ? approvals[part.toolCallId] : undefined;
  const running = status === 'pending' || status === 'streaming';
  const failed = status === 'error';
  const summary = running ? null : summarize(output);
  const definition = mcpInfo ? definitions[mcpInfo.toolName] : undefined;
  const details = approval?.details;

  if (!mcpInfo) {
    return null;
  }

  return (
    <Stack gap={4}>
      <Group gap={6} wrap="nowrap">
        <McpTransportIcon transport={transport} size={14} />
        <Text size="xs" c="dimmed">
          {serverName}
        </Text>
        <McpToolAnnotationBadges annotations={definition?.annotations} withTooltips />
      </Group>
      <McpTool
        part={part}
        mcpInfo={mcpInfo}
        chatStatus={running ? 'streaming' : 'ready'}
        className={classes.card}
      />
      {failed ? (
        <Alert color="red" variant="light" title="The server refused the call">
          {summary}
        </Alert>
      ) : (
        summary && (
          <Text size="xs" c="dimmed">
            {summary}
          </Text>
        )
      )}
      {approval && !approval.outcome && details && (
        <ToolApprovalFooter
          isPending={running}
          reason={details.reason}
          labels={{ approve: 'Allow', reject: 'Deny' }}
          approveOptions={APPROVE_OPTIONS}
          requestedBy={{ name: details.server, color: 'blue' }}
          ruleSuggestion={{ value: details.ruleSuggestion, label: 'Always allow this tool' }}
          onExplain={async () => ({
            risk: details.risk,
            explanation: details.explanation,
            reasoning: details.reasoning,
          })}
          onApprove={(scope) => decide(approval.requestId, (scope as ApprovalChoice) ?? 'once')}
          onReject={() => decide(approval.requestId, 'deny')}
        />
      )}
      {approval?.outcome && (
        <Group gap="xs">
          <Badge variant="light" color={OUTCOME_COLORS[approval.outcome]}>
            {OUTCOME_LABELS[approval.outcome]}
          </Badge>
          {approval.matchedRule && (
            <Text size="xs" c="dimmed">
              Rule: {approval.matchedRule}
            </Text>
          )}
        </Group>
      )}
    </Stack>
  );
}
