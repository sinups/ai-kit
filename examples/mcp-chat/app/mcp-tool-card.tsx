'use client';

import { Stack } from '@mantine/core';
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

export const ApprovalContext = createContext<ApprovalContextValue>({
  approvals: {},
  decide: () => {},
});

export function McpToolCard({ part }: CustomToolRendererProps) {
  const { approvals, decide } = use(ApprovalContext);
  const mcpInfo = parseMcpToolType(part.type);
  const approval = Object.values(approvals).find((item) => item.toolCallId === part.toolCallId);
  const finished = part.state === 'output-available' || part.state === 'output-error';

  if (!mcpInfo) {
    return null;
  }

  return (
    <Stack gap="xs">
      <McpTool part={part} mcpInfo={mcpInfo} />
      {approval && (
        <ToolApprovalFooter
          isPending={!finished}
          isComplete={finished}
          reason={approval.title ?? `The agent wants to call ${mcpInfo.toolName}`}
          labels={{ approve: 'Allow', reject: 'Deny', approved: 'Allowed', skipped: 'Denied' }}
          onApprove={() => decide(approval.requestId, 'allow')}
          onReject={() => decide(approval.requestId, 'deny')}
        />
      )}
    </Stack>
  );
}
