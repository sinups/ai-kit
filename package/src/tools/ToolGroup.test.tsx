import React from 'react';
import { render, screen } from '@mantine-tests/core';
import { ToolGroup } from './ToolGroup';

const nestedTools = [
  { type: 'tool-Read', toolCallId: 'r1', state: 'output-available' as const },
  { type: 'tool-Grep', toolCallId: 'g1', state: 'output-available' as const },
];

const part = {
  type: 'tool-Task',
  toolCallId: 'task-1',
  state: 'output-available' as const,
  input: { description: 'Explore the repository' },
};

describe('tools/ToolGroup', () => {
  it('summarizes the nested tools in English by default', () => {
    render(
      <ToolGroup
        part={part}
        nestedTools={nestedTools}
        chatStatus="ready"
        completeLabel="Task completed"
        interruptedLabel="Task interrupted"
      />
    );
    expect(screen.getByText('1 file and 1 search')).toBeInTheDocument();
  });

  it('takes the summary from labels', () => {
    render(
      <ToolGroup
        part={part}
        nestedTools={nestedTools}
        chatStatus="ready"
        completeLabel="Task completed"
        interruptedLabel="Task interrupted"
        labels={{
          files: (count) => `${count} файл`,
          searches: (count) => `${count} поиск`,
          summary: (parts) => parts.join(' и '),
        }}
      />
    );
    expect(screen.getByText('1 файл и 1 поиск')).toBeInTheDocument();
  });
});
