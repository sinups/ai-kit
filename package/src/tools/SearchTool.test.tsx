import React from 'react';
import { render, screen } from '@mantine-tests/core';
import type { ToolCallStep } from '../types/timeline';
import { SearchGroupRich } from './SearchTool';

const toolSteps: ToolCallStep[] = [
  {
    id: 's1',
    type: 'tool-call',
    toolName: 'Search',
    toolDetail: 'ToolRowBase',
    duration: 0,
    toolVariant: 'search',
    searchQuery: 'ToolRowBase',
  },
];

describe('tools/SearchTool', () => {
  it('counts the results in English by default', () => {
    render(
      <SearchGroupRich
        toolSteps={toolSteps}
        stepStates={{ s1: 'complete' }}
        onStepComplete={() => {}}
        results={[{ source: 'web', title: 'A result' }]}
      />
    );
    expect(screen.getByText('Found 1 results')).toBeInTheDocument();
  });

  it('takes the row label from labels', () => {
    render(
      <SearchGroupRich
        toolSteps={toolSteps}
        stepStates={{ s1: 'complete' }}
        onStepComplete={() => {}}
        results={[{ source: 'web', title: 'A result' }]}
        labels={{ found: (count) => `${count} Treffer` }}
      />
    );
    expect(screen.getByText('1 Treffer')).toBeInTheDocument();
  });
});
