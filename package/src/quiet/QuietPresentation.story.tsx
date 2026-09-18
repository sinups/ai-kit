import React from 'react';
import { AgentChat } from '../AgentChat/AgentChat';
import type { ChatMessage, ToolPart } from '../types';
import { quietPresentation } from './quiet-presentation';

export default { title: 'AgentChat/Quiet tools' };

const catalog = {
  mcp__tracker__tracker_issue_search: {
    title: 'Find issues',
    outputSchema: {
      type: 'object' as const,
      required: ['issues'],
      properties: {
        issues: {
          type: 'array' as const,
          title: 'Issues',
          items: {
            type: 'object' as const,
            required: ['key', 'title'],
            properties: { key: { type: 'string' as const }, title: { type: 'string' as const } },
          },
        },
        hasMore: { type: 'boolean' as const, title: 'More pages' },
      },
    },
  },
  mcp__tracker__tracker_workspace_context: { title: 'Current workspace' },
  mcp__deepwiki__read_wiki_structure: { title: 'Wiki structure' },
  mcp__tracker__tracker_issue_create: { title: 'Create an issue' },
};

function mcpResult(structuredContent: unknown) {
  return {
    content: [{ type: 'text', text: JSON.stringify(structuredContent) }],
    structuredContent,
  };
}

const issues: ToolPart = {
  type: 'tool-mcp__tracker__tracker_issue_search',
  toolCallId: 'issues',
  state: 'output-available',
  input: { assignee: 'alice', size: 100 },
  output: mcpResult({
    hasMore: false,
    issues: [
      { key: 'TRK-2', title: 'Video upload fails' },
      { key: 'TRK-4', title: 'Design the settings page' },
      { key: 'TRK-5', title: 'Review the release notes' },
      { key: 'TRK-8', title: 'Check the streaming' },
      { key: 'DOC-1', title: 'Describe the use cases' },
    ],
  }),
};

const messages: ChatMessage[] = [
  {
    id: 'u1',
    role: 'user',
    parts: [{ type: 'text', text: 'Where am I and what is on my plate?' }],
  },
  {
    id: 'a1',
    role: 'assistant',
    parts: [
      {
        type: 'tool-mcp__tracker__tracker_workspace_context',
        toolCallId: 'where',
        state: 'output-available',
        input: {},
        output: { content: [{ type: 'text', text: 'Workspace Acme, 2 projects, 3 members' }] },
      },
      issues,
      {
        type: 'tool-mcp__deepwiki__read_wiki_structure',
        toolCallId: 'wiki',
        state: 'output-available',
        input: { repoName: 'mantinedev/mantine' },
        output: [
          {
            type: 'text',
            text: [
              'Available pages for mantinedev/mantine:',
              '',
              ...Array.from({ length: 12 }, (_, index) => `- ${index + 1} Section ${index + 1}`),
            ].join('\n'),
          },
        ],
      },
      { type: 'text', text: 'You have **5 issues**. Shall I file one to review the report?' },
      {
        type: 'tool-mcp__tracker__tracker_issue_create',
        toolCallId: 'create',
        state: 'input-available',
        input: { title: 'Review the report' },
      },
    ],
  },
];

export function Usage() {
  return (
    <div style={{ height: '90vh', maxWidth: 640, margin: '0 auto', display: 'flex' }}>
      <AgentChat
        messages={messages}
        status="streaming"
        onSend={() => {}}
        onStop={() => {}}
        presentation={quietPresentation}
        toolCatalog={catalog}
        approvals={{ create: { onApprove: () => {}, onReject: () => {} } }}
        initialScrollBehavior="top"
      />
    </div>
  );
}
