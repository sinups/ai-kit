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
      required: ['assignee'],
      properties: {
        assignee: { type: 'string', title: 'Assignee' },
        overdue: { type: 'boolean', title: 'Overdue only' },
        size: { type: 'number', title: 'Page size' },
        sorting: { type: 'array', items: { type: 'object' } },
      },
    },
    outputSchema: {
      type: 'object',
      required: ['issues'],
      properties: {
        issues: {
          type: 'array',
          title: 'Issues',
          items: {
            type: 'object',
            required: ['id', 'title'],
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              dueDate: { type: 'string', format: 'date', title: 'Due' },
            },
          },
        },
        total: { type: 'number', title: 'Total' },
      },
    },
  },
  mcp__tracker__tracker_issue_files: {
    title: 'Files of an issue',
    annotations: { readOnlyHint: true },
  },
  mcp__tracker__tracker_issue_update: {
    title: 'Update an issue',
    description: 'Changes the state, the assignee or the due date of an issue.',
    annotations: { destructiveHint: false },
    inputSchema: {
      type: 'object',
      properties: {
        issue: { type: 'string', title: 'Issue' },
        dueDate: { type: 'string', format: 'date', title: 'Due' },
      },
    },
  },
};

function mcpResult(structuredContent: unknown) {
  return {
    content: [{ type: 'text', text: JSON.stringify(structuredContent) }],
    structuredContent,
  };
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
          assignee: 'alice',
          size: 100,
          sorting: [{ field: 'dueDate', direction: 'asc' }],
        },
        output: mcpResult({
          total: 12,
          issues: [
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
        input: { assignee: 'alice', overdue: true },
        output: mcpResult({
          total: 2,
          issues: [
            { id: 'TRK-400', title: 'Move the build to oxlint', dueDate: '2026-09-10' },
            { id: 'TRK-401', title: 'Update the licenses', dueDate: '2026-09-12' },
          ],
        }),
      },
      {
        type: 'tool-mcp__tracker__tracker_issue_files',
        toolCallId: 'files',
        state: 'output-available',
        input: { issue: 'TRK-400' },
        output: {
          content: [
            {
              type: 'image',
              mimeType: 'image/svg+xml',
              data: btoa(
                '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="120"><rect width="240" height="120" fill="aliceblue"/><text x="20" y="66" font-size="20" fill="steelblue">build.log</text></svg>'
              ),
            },
            {
              type: 'resource_link',
              uri: 'https://example.com/files/build-report.pdf',
              name: 'build-report.pdf',
              title: 'Build report',
              mimeType: 'application/pdf',
            },
          ],
        },
      },
      {
        type: 'text',
        text: 'You have **12 issues**, two are overdue: "Move the build to oxlint" and "Update the licenses". Shall I move the first one to Friday?',
      },
      {
        type: 'tool-mcp__tracker__tracker_issue_update',
        toolCallId: 'move',
        state: 'input-available',
        input: { issue: 'TRK-400', dueDate: '2026-09-25' },
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
