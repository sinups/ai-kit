'use client';

import { Accordion, Stack, Text } from '@mantine/core';
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
  definitions: Record<string, McpToolDefinition>;
};

export const ApprovalContext = createContext<ApprovalContextValue>({
  approvals: {},
  decide: () => {},
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

function readableValue(value: unknown): string | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  if (Array.isArray(value)) {
    const items = value.map(readableValue).filter(Boolean);
    return items.length > 0 ? items.join(', ') : null;
  }
  if (typeof value === 'object') {
    return null;
  }
  const text = String(value).replace(/^__|__$/g, '');
  return text.length > 40 ? `${text.slice(0, 39)}…` : text;
}

function argumentSummary(values: Record<string, unknown>): string | null {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(values)) {
    const text = readableValue(value);
    if (text) {
      parts.push(`${key}: ${text}`);
    }
    if (parts.length === 3) {
      break;
    }
  }
  return parts.length > 0 ? parts.join(' · ') : null;
}

function describesValues(definition: McpToolDefinition | undefined): boolean {
  const properties = definition?.inputSchema?.properties;
  return Boolean(properties && Object.keys(properties).length > 0);
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
  const size =
    text.length >= 1024 ? `${Math.round(text.length / 1024)} KB` : `${text.length} chars`;
  return items ? `${items} ${items === 1 ? 'item' : 'items'} · ${size}` : size;
}

export function McpToolCard({ part, input, output, status }: CustomToolRendererProps) {
  const { approvals, decide, definitions } = use(ApprovalContext);
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

  const values = flatten(input);
  const summary = argumentSummary(values);
  const meta: string[] = [mcpInfo.serverName];
  if (definition?.annotations?.destructiveHint) {
    meta.push('writes');
  } else if (definition?.annotations?.readOnlyHint) {
    meta.push('read-only');
  }
  if (approval?.outcome) {
    meta.push(OUTCOME_LABELS[approval.outcome]);
  }
  if (typeof part.durationMs === 'number') {
    meta.push(`${(part.durationMs / 1000).toFixed(1)}s`);
  }
  if (!running && !failed) {
    const result = summarize(output);
    if (result) {
      meta.push(result);
    }
  }

  return (
    <Stack gap={0} className={classes.call}>
      <McpTool
        part={{ ...part, input: headerArgs(input) }}
        mcpInfo={mcpInfo}
        chatStatus={running ? 'streaming' : 'ready'}
        className={classes.card}
      />
      {meta.length > 0 && (
        <Text size="xs" c="dimmed" className={classes.meta}>
          {meta.join(' · ')}
        </Text>
      )}
      {asking && summary && (
        <Accordion variant="unstyled" chevronPosition="left" className={classes.arguments}>
          <Accordion.Item value="arguments">
            <Accordion.Control>
              <Text size="xs" c="dimmed" lineClamp={1}>
                {summary}
              </Text>
            </Accordion.Control>
            <Accordion.Panel>
              {describesValues(definition) && definition?.inputSchema ? (
                <SchemaValues
                  schema={definition.inputSchema}
                  values={values}
                  hideMissing
                  className={classes.table}
                />
              ) : (
                <Stack gap={2}>
                  {Object.entries(values).map(([key, value]) => (
                    <Text key={key} size="xs" c="dimmed">
                      {key}: {readableValue(value) ?? JSON.stringify(value)}
                    </Text>
                  ))}
                </Stack>
              )}
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion>
      )}
      {failed && (
        <ToolResultNotice
          variant="error"
          toolName={mcpInfo.displayName}
          errorText={typeof output === 'string' ? output : JSON.stringify(output, null, 2)}
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
