import React from 'react';
import { render, screen } from '@mantine-tests/core';
import type { ToolCallStep } from '../types/timeline';
import { routeToolCall } from './tool-router';

const step = (overrides: Partial<ToolCallStep>): ToolCallStep => ({
  id: 's1',
  type: 'tool-call',
  toolName: 'Read',
  toolDetail: 'index.ts',
  duration: 0,
  ...overrides,
});

describe('tools/routeToolCall', () => {
  it('does not render Read steps as an edit card', () => {
    render(<>{routeToolCall(step({ filePath: '/repo/index.ts' }), 'complete', () => {}, 0)}</>);
    expect(screen.queryByText(/Edited/)).toBeNull();
  });

  it('renders Edit steps as an edit card', () => {
    render(
      <>
        {routeToolCall(
          step({ toolName: 'Edit', filePath: '/repo/index.ts' }),
          'complete',
          () => {},
          0
        )}
      </>
    );
    expect(screen.getByText('Edited index.ts')).toBeInTheDocument();
  });
});
