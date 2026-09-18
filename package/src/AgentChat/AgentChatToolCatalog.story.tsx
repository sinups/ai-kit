import React from 'react';
import type { ToolApprovals } from '../approvals/tool-approvals';
import type { ToolCatalog } from '../tools/tool-presentation';
import type { ChatMessage } from '../types';
import { AgentChat } from './AgentChat';

export default { title: 'AgentChat/Tool catalog' };

const catalog: ToolCatalog = {
  mcp__tracker__tracker_issue_search: {
    title: 'Find issues',
    description: 'Searches the issues of the workspace by assignee, due date and state.',
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: 'object',
      properties: {
        assignee: { type: 'string' },
        overdue: { type: 'boolean' },
        size: { type: 'number' },
        sorting: { type: 'array', items: { type: 'object' } },
      },
    },
  },
  mcp__tracker__tracker_issue_update: {
    title: 'Update an issue',
    description: 'Changes the state, the assignee or the due date of an issue.',
    annotations: { destructiveHint: false },
  },
};

function mcpText(value: unknown) {
  return { content: [{ type: 'text', text: JSON.stringify(value) }] };
}

const messages: ChatMessage[] = [
  {
    id: 'u1',
    role: 'user',
    parts: [{ type: 'text', text: 'What is assigned to me and what is overdue?' }],
  },
  {
    id: 'a1',
    role: 'assistant',
    parts: [
      { type: 'text', text: 'Let me look at your issues and their due dates.' },
      {
        type: 'tool-mcp__tracker__tracker_issue_search',
        toolCallId: 'mine',
        state: 'output-available',
        input: {
          payload: JSON.stringify({
            assignee: 'alice',
            size: 100,
            sorting: [{ field: 'dueDate', direction: 'asc' }],
            workspaceId: '0b8e2c1a-7f4d-4a55-9d2e-3c1b5a6f7e80',
          }),
        },
        output: mcpText({
          total: 12,
          items: [
            { id: 'TRK-400', title: 'Move the build to oxlint', dueDate: '2026-09-10' },
            { id: 'TRK-401', title: 'Update the licenses', dueDate: '2026-09-12' },
            { id: 'TRK-405', title: 'Prepare the 0.3 release', dueDate: '2026-09-25' },
          ],
        }),
      },
      {
        type: 'tool-mcp__tracker__tracker_issue_search',
        toolCallId: 'overdue',
        state: 'output-available',
        input: { payload: JSON.stringify({ assignee: 'alice', overdue: true }) },
        output: mcpText({
          total: 2,
          items: [
            { id: 'TRK-400', title: 'Move the build to oxlint', dueDate: '2026-09-10' },
            { id: 'TRK-401', title: 'Update the licenses', dueDate: '2026-09-12' },
          ],
        }),
      },
      {
        type: 'text',
        text: 'You have **12 issues**, two are overdue: "Move the build to oxlint" and "Update the licenses". Shall I move the first one to Friday?',
      },
      {
        type: 'tool-mcp__tracker__tracker_issue_update',
        toolCallId: 'move',
        state: 'input-available',
        input: { payload: JSON.stringify({ issue: 'TRK-400', dueDate: '2026-09-25' }) },
      },
    ],
  },
];

const approvals: ToolApprovals = {
  move: { onApprove: () => {}, onReject: () => {}, reason: 'Changes the due date of TRK-400' },
};

export function Usage() {
  return (
    <div style={{ height: '90vh', maxWidth: 640, margin: '0 auto', display: 'flex' }}>
      <AgentChat
        messages={messages}
        status="ready"
        onSend={() => {}}
        onStop={() => {}}
        toolCatalog={catalog}
        approvals={approvals}
        initialScrollBehavior="top"
      />
    </div>
  );
}
