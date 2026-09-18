'use client';

import { Group, Stack, Text } from '@mantine/core';
import {
  type CustomToolRendererProps,
  McpTool,
  type McpToolDefinition,
  parseMcpToolType,
  SchemaValues,
  ToolApprovalFooter,
  ToolResultNotice,
} from '@sinups/ai-kit';
import { createContext, use } from 'react';
import type { ApprovalChoice } from '@/lib/events';
import type { ApprovalState } from '@/lib/use-agent-chat';
import classes from './mcp-tool-card.module.css';

type ApprovalContextValue = {
  approvals: Record<string, ApprovalState>;
  decide: (requestId: string, choice: ApprovalChoice) => void;
  serverName: string;
  definitions: Record<string, McpToolDefinition>;
};

export const ApprovalContext = createContext<ApprovalContextValue>({
  approvals: {},
  decide: () => {},
  serverName: 'mcp',
  definitions: {},
});

const OUTCOME_LABELS = {
  once: 'allowed once',
  session: 'allowed',
  always: 'allowed',
  deny: 'denied',
  auto: 'auto',
  rule: 'by rule',
} as const;

const APPROVE_OPTIONS = [
  { value: 'once', label: 'Allow once', description: 'Ask again next time' },
  { value: 'session', label: 'Allow for this chat', description: 'Until the chat is reset' },
];

const SUMMARY_KEYS = ['title', 'name', 'query', 'projectName', 'path', 'q'];

/** MCP servers often take one `payloadJson` string; the header needs the values inside it */
function flatten(input: Record<string, unknown>): Record<string, unknown> {
  const flat: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (typeof value === 'string' && value.trim().startsWith('{')) {
      try {
        Object.assign(flat, JSON.parse(value) as Record<string, unknown>);
        continue;
      } catch {
        flat[key] = value;
        continue;
      }
    }
    flat[key] = value;
  }
  return flat;
}

function headerArgs(input: Record<string, unknown>): Record<string, unknown> {
  const flat = flatten(input);
  const picked: Record<string, unknown> = {};
  for (const key of SUMMARY_KEYS) {
    const value = flat[key];
    if (typeof value === 'string' && value.length <= 60) {
      picked[key] = value;
      break;
    }
  }
  return picked;
}

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
  if (items) {
    return `${items} ${items === 1 ? 'item' : 'items'}`;
  }
  return text.length >= 1024 ? `${Math.round(text.length / 1024)} KB` : `${text.length} chars`;
}

export function McpToolCard({ part, input, output, status }: CustomToolRendererProps) {
  const { approvals, decide, serverName, definitions } = use(ApprovalContext);
  const mcpInfo = parseMcpToolType(part.type);
  const approval = part.toolCallId ? approvals[part.toolCallId] : undefined;
  const running = status === 'pending' || status === 'streaming';
  const failed = status === 'error';
  const definition = mcpInfo ? definitions[mcpInfo.toolName] : undefined;
  const details = approval?.details;
  const asking = Boolean(approval && !approval.outcome && details);

  if (!mcpInfo) {
    return null;
  }

  const meta = [serverName];
  if (definition?.annotations?.destructiveHint) {
    meta.push('writes');
  } else if (definition?.annotations?.readOnlyHint) {
    meta.push('read-only');
  }
  if (approval?.outcome) {
    meta.push(OUTCOME_LABELS[approval.outcome]);
  }
  if (!running && !failed) {
    const summary = summarize(output);
    if (summary) {
      meta.push(summary);
    }
  }

  return (
    <Stack gap={6}>
      <McpTool
        part={{ ...part, input: headerArgs(input) }}
        mcpInfo={mcpInfo}
        chatStatus={running ? 'streaming' : 'ready'}
        className={classes.card}
      />
      <Group gap={6} wrap="nowrap">
        <Text size="xs" c="dimmed">
          {meta.join(' · ')}
        </Text>
      </Group>
      {failed && (
        <ToolResultNotice
          variant="error"
          toolName={mcpInfo.displayName}
          errorText={typeof output === 'string' ? output : JSON.stringify(output, null, 2)}
        />
      )}
      {asking && definition?.inputSchema && (
        <SchemaValues
          schema={definition.inputSchema}
          values={flatten(input)}
          hideMissing
          className={classes.arguments}
        />
      )}
      {asking && details && (
        <ToolApprovalFooter
          isPending={running}
          reason={details.reason}
          labels={{ approve: 'Allow', reject: 'Deny' }}
          approveOptions={APPROVE_OPTIONS}
          requestedBy={{ name: details.server, color: 'gray' }}
          ruleSuggestion={{ value: details.ruleSuggestion, label: 'Always allow this tool' }}
          onExplain={async () => ({
            risk: details.risk,
            explanation: details.explanation,
            reasoning: details.reasoning,
          })}
          onApprove={(scope) => decide(approval!.requestId, (scope as ApprovalChoice) ?? 'once')}
          onReject={() => decide(approval!.requestId, 'deny')}
        />
      )}
    </Stack>
  );
}
