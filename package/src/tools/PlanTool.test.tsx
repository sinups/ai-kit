import React from 'react';
import { render, screen } from '@mantine-tests/core';
import { PlanTool } from './PlanTool';

const part = {
  type: 'tool-PlanWrite',
  toolCallId: 'plan-1',
  state: 'output-available' as const,
  input: { plan: { id: 'refactor', title: 'Split the composer' } },
};

describe('tools/PlanTool', () => {
  it('uses the English defaults', () => {
    render(<PlanTool part={part} />);
    expect(screen.getByText('Approve')).toBeInTheDocument();
    expect(screen.getByText('No plan summary provided.')).toBeInTheDocument();
  });

  it('takes the button and empty text from labels', () => {
    render(<PlanTool part={part} labels={{ approve: 'Aprobar', noSummary: 'Sin resumen' }} />);
    expect(screen.getByText('Aprobar')).toBeInTheDocument();
    expect(screen.getByText('Sin resumen')).toBeInTheDocument();
  });
});
