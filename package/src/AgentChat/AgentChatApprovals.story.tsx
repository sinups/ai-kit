import React, { useState } from 'react';
import { Paper } from '@mantine/core';
import { expect, userEvent, within } from '@storybook/test';
import type { ToolApprovals } from '../approvals/tool-approvals';
import type { ChatMessage } from '../types';
import { AgentChat } from './AgentChat';

export default { title: 'AgentChat/Approvals' };

const CALL_ID = 'call-create-issue';

const messages: ChatMessage[] = [
  {
    id: 'u1',
    role: 'user',
    parts: [{ type: 'text', text: 'File the flaky upload test in the tracker.' }],
  },
  {
    id: 'a1',
    role: 'assistant',
    parts: [
      { type: 'text', text: 'I will open an issue with the failing run attached.' },
      {
        type: 'tool-mcp__tracker__create_issue',
        toolCallId: CALL_ID,
        state: 'input-available',
        input: { title: 'Flaky upload test', project: 'pipeline' },
      },
    ],
  },
];

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <Paper
      withBorder
      radius={0}
      h={560}
      maw={640}
      m="xl"
      display="flex"
      style={{ flexDirection: 'column' }}
    >
      {children}
    </Paper>
  );
}

function ApprovalChat() {
  const [approvals, setApprovals] = useState<ToolApprovals>({
    [CALL_ID]: {
      isPending: true,
      reason: 'Creates an issue in the tracker workspace',
      requestedBy: { name: 'triage agent', color: 'blue' },
      matchedRule: 'mcp__tracker__*',
      approveOptions: [
        { value: 'once', label: 'Allow once' },
        { value: 'session', label: 'Allow for this session' },
      ],
      onApprove: (scope) =>
        setApprovals({ [CALL_ID]: { outcome: { decision: 'approved', scope } } }),
      onReject: () => setApprovals({ [CALL_ID]: { outcome: { decision: 'rejected' } } }),
    },
  });

  return (
    <Frame>
      <AgentChat
        messages={messages}
        status="ready"
        onSend={() => {}}
        onStop={() => {}}
        approvals={approvals}
      />
    </Frame>
  );
}

export function Usage() {
  return <ApprovalChat />;
}

export function Settled() {
  return (
    <Frame>
      <AgentChat
        messages={messages}
        status="ready"
        onSend={() => {}}
        onStop={() => {}}
        approvals={{ [CALL_ID]: { outcome: { decision: 'approved', scope: 'session' } } }}
      />
    </Frame>
  );
}

export const ApprovalFlow = {
  render: () => <ApprovalChat />,
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Creates an issue in the tracker workspace')).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: 'Next' }));
    await expect(canvas.getByText('Approved')).toBeInTheDocument();
  },
};
