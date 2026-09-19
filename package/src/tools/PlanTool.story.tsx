import React from 'react';
import { Stack } from '@mantine/core';
import { PlanTool } from './PlanTool';

export default { title: 'Tools/PlanTool' };

const summary = `## Goal

Port the tool cards from the Tailwind reference to Mantine.

1. Read the brief and the foundation (\`types.ts\`, utils, hooks).
2. Port each card keeping labels and behavior **1:1**.
3. Replace \`@pierre/diffs\` with an in-house unified diff view.
4. Add stories for pending, success, error and interrupted states.
5. Run tsc, oxlint, oxfmt and stylelint.`;

export function Usage() {
  return (
    <Stack p={40} maw={420} gap={16}>
      <PlanTool
        part={{
          type: 'tool-PlanWrite',
          toolCallId: 'p1',
          state: 'input-available',
          input: { plan: { id: 'tools-port', title: 'Port tool cards to Mantine', summary } },
        }}
        chatStatus="streaming"
      />
      <PlanTool
        part={{
          type: 'tool-PlanWrite',
          toolCallId: 'p2',
          state: 'output-available',
          input: {
            plan: { id: 'tools-port', title: 'Port tool cards to Mantine', summary },
            onApprove: () => console.log('approved'),
          },
          output: { success: true },
        }}
        chatStatus="ready"
      />
      <PlanTool
        part={{
          type: 'tool-PlanWrite',
          toolCallId: 'p3',
          state: 'output-available',
          input: { plan: { title: 'Plan without summary' }, approved: true },
          output: { success: true },
        }}
        chatStatus="ready"
      />
    </Stack>
  );
}
