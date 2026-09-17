import React from 'react';
import { Stack } from '@mantine/core';
import type { CustomToolRendererProps } from '../types';
import { ToolRenderer } from './ToolRenderer';
import { bashPart, editPart, NESTED_TOOLS } from './_stories-shared';

export default { title: 'tools/ToolRenderer' };

function WeatherCard({ name, input, output, status }: CustomToolRendererProps) {
  return (
    <div style={{ fontSize: 12, color: 'var(--ae-fg-muted)' }}>
      {name} ({status}): {JSON.stringify(input)} → {JSON.stringify(output)}
    </div>
  );
}

export function Usage() {
  return (
    <Stack p={40} maw={420} gap={16}>
      <ToolRenderer
        part={bashPart('output-available', { output: { stdout: 'ok', exitCode: 0 } })}
      />
      <ToolRenderer part={editPart('output-available', { output: { success: true } })} />
      <ToolRenderer
        part={{
          type: 'tool-Read',
          toolCallId: 'r1',
          state: 'input-available',
          input: { file_path: '/project/src/index.ts' },
        }}
        chatStatus="streaming"
      />
      <ToolRenderer
        part={{
          type: 'tool-WebFetch',
          toolCallId: 'wf1',
          state: 'output-available',
          input: { url: 'https://www.mantine.dev/core/collapse' },
          output: 'html',
        }}
      />
      <ToolRenderer
        part={{
          type: 'tool-Task',
          toolCallId: 'task-1',
          state: 'output-available',
          input: { description: 'Explore' },
          output: { totalDurationMs: 9000 },
        }}
        nestedTools={NESTED_TOOLS.slice(0, 3)}
        chatStatus="ready"
      />
      <ToolRenderer
        part={{
          type: 'tool-mcp__user-tools__weather',
          toolCallId: 'w1',
          state: 'output-available',
          input: { city: 'Chisinau' },
          output: [{ type: 'text', text: '{"temp":21}' }],
        }}
        toolRenderers={{ weather: WeatherCard }}
      />
      <ToolRenderer
        part={{
          type: 'tool-mcp__git__list_issues',
          toolCallId: 'gh1',
          state: 'output-available',
          input: { repo: 'mantinedev/mantine' },
          output: '[]',
        }}
      />
      <ToolRenderer
        part={{ type: 'tool-CustomThing', toolCallId: 'c1', state: 'input-available' }}
        chatStatus="streaming"
      />
      <ToolRenderer
        part={{ type: 'tool-CustomThing', toolCallId: 'c2', state: 'output-available', output: 1 }}
      />
    </Stack>
  );
}
