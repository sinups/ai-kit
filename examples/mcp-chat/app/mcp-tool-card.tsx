'use client';

import { Badge, Group, Stack, Text } from '@mantine/core';
import {
  type CustomToolRendererProps,
  McpTool,
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
};

export const ApprovalContext = createContext<ApprovalContextValue>({
  approvals: {},
  decide: () => {},
});

const OUTCOME_LABELS = {
  allow: 'Allowed',
  always: 'Allowed',
  deny: 'Denied',
  auto: 'Auto',
} as const;

const OUTCOME_COLORS = {
  allow: 'green',
  always: 'green',
  deny: 'red',
  auto: 'blue',
} as const;

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
  const { approvals, decide } = use(ApprovalContext);
  const mcpInfo = parseMcpToolType(part.type);
  const approval = part.toolCallId ? approvals[part.toolCallId] : undefined;
  const running = status === 'pending' || status === 'streaming';
  const summary = running ? null : summarize(output);

  if (!mcpInfo) {
    return null;
  }

  return (
    <Stack gap={4}>
      <McpTool
        part={part}
        mcpInfo={mcpInfo}
        chatStatus={running ? 'streaming' : 'ready'}
        className={classes.card}
      />
      {summary && (
        <Text size="xs" c="dimmed">
          {summary}
        </Text>
      )}
      {approval && !approval.outcome && (
        <ToolApprovalFooter
          isPending={running}
          reason={approval.title ?? `The agent wants to call ${mcpInfo.toolName}`}
          labels={{ approve: 'Allow', reject: 'Deny' }}
          approveOptions={[
            {
              value: 'always',
              label: 'Always allow',
              description: 'Stop asking for this tool in this chat',
            },
          ]}
          onApprove={(scope) => decide(approval.requestId, scope === 'always' ? 'always' : 'allow')}
          onReject={() => decide(approval.requestId, 'deny')}
        />
      )}
      {approval?.outcome && (
        <Group gap="xs">
          <Badge variant="light" color={OUTCOME_COLORS[approval.outcome]}>
            {OUTCOME_LABELS[approval.outcome]}
          </Badge>
        </Group>
      )}
    </Stack>
  );
}
