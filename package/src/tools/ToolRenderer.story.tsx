import React from 'react';
import { Stack } from '@mantine/core';
import type { ChatMessage, CustomToolRendererProps } from '../types';
import { createToolCallLookups } from './tool-call-state';
import { ToolRenderer } from './ToolRenderer';
import { bashPart, editPart, NESTED_TOOLS } from './_story-helpers';

export default { title: 'Tools/ToolRenderer' };

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

const QUEUE: ChatMessage = {
  id: 'm1',
  role: 'assistant',
  parts: [
    {
      type: 'tool-Bash',
      toolCallId: 'k1',
      state: 'input-available',
      input: { command: 'yarn jest package/src/tools' },
    },
    {
      type: 'tool-Read',
      toolCallId: 'k2',
      state: 'input-available',
      input: { file_path: '/repo/src/tools/ToolRenderer.tsx' },
    },
    {
      type: 'tool-Grep',
      toolCallId: 'k3',
      state: 'input-available',
      input: { pattern: 'deriveToolCallState', path: '/repo/src' },
    },
  ],
};

function BrokenCard(): React.ReactElement {
  throw new Error('This renderer throws on every render');
}

/** A call whose arguments are still arriving, a queue behind it and a call waiting for a decision */
export function DerivedStates() {
  const lookups = createToolCallLookups([QUEUE]);
  const waiting = {
    type: 'tool-Bash',
    toolCallId: 'p1',
    state: 'input-available',
    input: { command: 'rm -rf dist' },
  };
  const permissionLookups = { isAwaitingPermission: (id: string) => id === 'p1' };

  return (
    <Stack p={40} maw={420} gap={16}>
      <ToolRenderer
        chatStatus="streaming"
        part={{
          type: 'tool-Bash',
          toolCallId: 's1',
          state: 'input-streaming',
          input: '{"command": "yarn jest pack',
        }}
      />
      <ToolRenderer
        chatStatus="streaming"
        part={{
          type: 'tool-Edit',
          toolCallId: 's2',
          state: 'input-streaming',
          input: '{"file_path": "/repo/src/tools/ToolRenderer.tsx", "old_str',
        }}
      />
      <ToolRenderer part={waiting} chatStatus="streaming" lookups={permissionLookups} />
      {QUEUE.parts.map((part, index) => (
        <ToolRenderer key={index} part={part} chatStatus="streaming" lookups={lookups} />
      ))}
    </Stack>
  );
}

/** A restored transcript with a malformed entry and a consumer renderer that throws */
export function BrokenEntries() {
  return (
    <Stack p={40} maw={420} gap={16}>
      <ToolRenderer
        part={{
          type: 'tool-Bash',
          toolCallId: 'x1',
          state: 'output-available',
          input: 'not json at all',
          output: { stdout: 'ok', exitCode: 0 },
        }}
      />
      <ToolRenderer
        part={{
          type: 'tool-Grep',
          toolCallId: 'x2',
          state: 'output-available',
          input: { pattern: 'ToolRowBase' },
          output: ['unexpected', 42],
        }}
      />
      <ToolRenderer
        part={{
          type: 'tool-Read',
          toolCallId: 'x3',
          state: 'output-available',
          input: { file_path: '/repo/src/index.ts' },
          output: 'content',
        }}
        toolRenderers={{ 'tool-Read': BrokenCard }}
      />
    </Stack>
  );
}
