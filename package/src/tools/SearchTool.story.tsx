import React from 'react';
import { Stack } from '@mantine/core';
import { SearchTool, type SearchResult } from './SearchTool';

export default { title: 'Tools/SearchTool' };

const results: SearchResult[] = [
  { source: 'web', title: 'mantinedev/mantine — Collapse component', date: '2 days ago' },
  { source: 'stackoverflow', title: 'How to animate height with CSS grid', date: 'Mar 2026' },
  { source: 'web', title: 'MDN: interpolate-size', date: '' },
];

export function Usage() {
  return (
    <Stack p={40} maw={420} gap={16}>
      <SearchTool
        part={{
          type: 'tool-WebSearch',
          toolCallId: 'ws-1',
          state: 'input-available',
          input: { query: 'mantine collapse animation' },
        }}
      />
      <SearchTool
        part={{
          type: 'tool-WebSearch',
          toolCallId: 'ws-2',
          state: 'output-available',
          input: { query: 'mantine collapse animation' },
          output: { results },
        }}
        defaultOpen
      />
      <SearchTool
        part={{
          type: 'tool-Grep',
          toolCallId: 'grep-1',
          state: 'output-available',
          input: { pattern: 'ToolRowBase' },
          output: { numFiles: 0 },
        }}
      />
      <SearchTool
        part={{
          type: 'tool-Glob',
          toolCallId: 'glob-1',
          state: 'output-error',
          input: { pattern: '**/*.tsx' },
          errorText: 'Permission denied',
        }}
      />
    </Stack>
  );
}
