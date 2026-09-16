import React from 'react';
import { Stack } from '@mantine/core';
import { McpTool } from './McpTool';
import { parseMcpToolType } from './tool-registry';

export default { title: 'tools/McpTool' };

const info = parseMcpToolType('tool-mcp__layers__search_tasks')!;

export function Usage() {
  return (
    <Stack p={40} maw={420} gap={16}>
      <McpTool
        part={{
          type: 'tool-mcp__layers__search_tasks',
          toolCallId: 'm1',
          state: 'input-streaming',
        }}
        mcpInfo={info}
        chatStatus="streaming"
      />
      <McpTool
        part={{
          type: 'tool-mcp__layers__search_tasks',
          toolCallId: 'm2',
          state: 'input-available',
          input: { query: 'overdue tasks', workspace: 'layers-dev' },
        }}
        mcpInfo={info}
        chatStatus="streaming"
      />
      <McpTool
        part={{
          type: 'tool-mcp__layers__search_tasks',
          toolCallId: 'm3',
          state: 'output-available',
          input: { query: 'overdue tasks' },
          output: [
            {
              type: 'text',
              text: JSON.stringify({
                total: 2,
                items: [
                  { id: 1, title: 'Fix login' },
                  { id: 2, title: 'Ship v2' },
                ],
              }),
            },
          ],
        }}
        mcpInfo={info}
        chatStatus="ready"
        defaultOpen
      />
      <McpTool
        part={{
          type: 'tool-mcp__layers__search_tasks',
          toolCallId: 'm4',
          state: 'output-available',
          input: { query: 'notes' },
          output: 'Plain text result from the server.',
        }}
        mcpInfo={info}
        chatStatus="ready"
      />
      <McpTool
        part={{
          type: 'tool-mcp__layers__search_tasks',
          toolCallId: 'm5',
          state: 'input-available',
        }}
        mcpInfo={info}
        chatStatus="ready"
      />
    </Stack>
  );
}
