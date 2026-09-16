import React from 'react';
import { Stack } from '@mantine/core';
import { SubagentTool } from './SubagentTool';
import { NESTED_TOOLS } from './_stories-shared';

export default { title: 'tools/SubagentTool' };

export function Usage() {
  return (
    <Stack p={40} maw={420} gap={24}>
      <SubagentTool
        part={{
          type: 'tool-Task',
          toolCallId: 'sub-1',
          state: 'input-available',
          input: { description: 'Review the diff for regressions' },
          startedAt: Date.now() - 5_000,
        }}
        nestedTools={NESTED_TOOLS}
        chatStatus="streaming"
      />
      <SubagentTool
        part={{
          type: 'tool-Task',
          toolCallId: 'sub-2',
          state: 'output-available',
          input: { description: 'Review the diff for regressions' },
          output: { duration: 65_000 },
        }}
        nestedTools={NESTED_TOOLS.slice(0, 3)}
        chatStatus="ready"
      />
      <SubagentTool
        part={{
          type: 'tool-Task',
          toolCallId: 'sub-3',
          state: 'input-available',
          input: { description: 'Interrupted' },
        }}
        chatStatus="ready"
      />
    </Stack>
  );
}
