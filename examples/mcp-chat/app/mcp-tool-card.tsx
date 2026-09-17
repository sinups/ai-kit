'use client';

import { Badge, Group, Stack } from '@mantine/core';
import {
  type CustomToolRendererProps,
  McpTool,
  parseMcpToolType,
  ToolApprovalFooter,
} from '@sinups/ai-kit';
import { createContext, use } from 'react';
import type { ApprovalDecision } from '@/lib/events';
import type { ApprovalState } from '@/lib/use-agent-chat';

type ApprovalContextValue = {
  approvals: Record<string, ApprovalState>;
  decide: (requestId: string, decision: ApprovalDecision) => void;
};

const SHORT_OUTPUT = 600;

export const ApprovalContext = createContext<ApprovalContextValue>({
  approvals: {},
  decide: () => {},
});

export function McpToolCard({ part, output, status }: CustomToolRendererProps) {
  const { approvals, decide } = use(ApprovalContext);
  const mcpInfo = parseMcpToolType(part.type);
  const approval = Object.values(approvals).find((item) => item.toolCallId === part.toolCallId);
  const running = status === 'pending' || status === 'streaming';
  const settled = status === 'success' || status === 'error';
  const short = settled && JSON.stringify(output ?? '').length <= SHORT_OUTPUT;

  if (!mcpInfo) {
    return null;
  }

  return (
    <Stack gap="xs">
      <McpTool
        key={settled ? 'settled' : 'running'}
        part={part}
        mcpInfo={mcpInfo}
        chatStatus={running ? 'streaming' : 'ready'}
        defaultOpen={short}
      />
      {approval && !approval.decision && (
        <ToolApprovalFooter
          isPending={running}
          reason={approval.title ?? `The agent wants to call ${mcpInfo.toolName}`}
          labels={{ approve: 'Allow', reject: 'Deny' }}
          onApprove={() => decide(approval.requestId, 'allow')}
          onReject={() => decide(approval.requestId, 'deny')}
        />
      )}
      {approval?.decision && (
        <Group gap="xs">
          <Badge variant="light" color={approval.decision === 'allow' ? 'green' : 'red'}>
            {approval.decision === 'allow' ? 'Allowed' : 'Denied'}
          </Badge>
        </Group>
      )}
    </Stack>
  );
}
