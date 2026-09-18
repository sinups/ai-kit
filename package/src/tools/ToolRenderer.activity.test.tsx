import React from 'react';
import { render, screen } from '@mantine-tests/core';
import { act } from '@testing-library/react';
import type { ToolPart } from '../types';
import { createToolCallLookups } from './tool-call-state';
import { ToolRenderer } from './ToolRenderer';

const runningCall: ToolPart = {
  type: 'tool-mcp__layers__task_list',
  toolCallId: 'c1',
  state: 'input-available',
  input: { overdue: true },
};

function tick(ms: number) {
  act(() => {
    jest.advanceTimersByTime(ms);
  });
}

describe('tools/ToolRenderer activity', () => {
  it('shows no time and no progress until the host asks for it', () => {
    render(
      <ToolRenderer
        part={{ ...runningCall, progress: { progress: 3, total: 10 } }}
        chatStatus="streaming"
      />
    );
    jest.advanceTimersByTime(4000);
    expect(screen.queryByText('30%')).toBeNull();
    expect(screen.queryByText('3s')).toBeNull();
  });

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('counts the time of a running call the host reports no start time for', () => {
    render(<ToolRenderer part={runningCall} chatStatus="streaming" showActivity />);

    expect(screen.queryByText('2s')).toBeNull();
    tick(2500);
    expect(screen.getByText('2s')).toBeInTheDocument();
    tick(1000);
    expect(screen.getByText('3s')).toBeInTheDocument();
  });

  it('keeps the running state that the lookups derive from the transcript', () => {
    const lookups = createToolCallLookups([{ id: 'm1', role: 'assistant', parts: [runningCall] }]);
    render(
      <ToolRenderer part={runningCall} chatStatus="streaming" lookups={lookups} showActivity />
    );

    tick(2500);
    expect(screen.getByText('2s')).toBeInTheDocument();
    expect(screen.queryByText('Queued')).toBeNull();
  });

  it('stops counting once the call has a result', () => {
    const { rerender } = render(
      <ToolRenderer part={runningCall} chatStatus="streaming" showActivity />
    );
    tick(2500);
    expect(screen.getByText('2s')).toBeInTheDocument();

    rerender(
      <ToolRenderer
        part={{ ...runningCall, state: 'output-available', output: { tasks: [] } }}
        chatStatus="streaming"
        showActivity
      />
    );
    tick(3000);
    expect(screen.queryByText('2s')).toBeNull();
    expect(screen.queryByText('5s')).toBeNull();
  });

  it('shows the progress an MCP server reports while the call runs', () => {
    render(
      <ToolRenderer
        part={{ ...runningCall, progress: { progress: 3, total: 10, message: 'Reading tasks' } }}
        chatStatus="streaming"
        showActivity
      />
    );

    expect(screen.getByText('30%')).toBeInTheDocument();
    expect(screen.getByText('Reading tasks')).toBeInTheDocument();
  });

  it('shows no progress once the call is done', () => {
    render(
      <ToolRenderer
        part={{
          ...runningCall,
          state: 'output-available',
          output: { tasks: [] },
          progress: { progress: 10, total: 10 },
        }}
        chatStatus="streaming"
        showActivity
      />
    );

    expect(screen.queryByText('100%')).toBeNull();
  });
});
