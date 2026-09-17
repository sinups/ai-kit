import React from 'react';
import { render, screen } from '@mantine-tests/core';
import { act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AgentStatus } from './AgentStatus';

describe('AgentStatus', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders the label, elapsed time and tokens', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-01-01T00:00:10Z'));
    render(
      <AgentStatus
        startedAt={new Date('2026-01-01T00:00:00Z')}
        lastActivityAt={Date.now()}
        tokens={1234}
      />
    );
    expect(screen.getByText('Thinking')).toBeInTheDocument();
    expect(screen.getByText('10s')).toBeInTheDocument();
    expect(screen.getByText('↓ 1.2k tokens')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(/^Thinking$/);
  });

  it('switches to the stalled state after the threshold', () => {
    jest.useFakeTimers();
    const now = Date.now();
    const { container } = render(
      <AgentStatus lastActivityAt={now} stalledLabel="Waiting for response" stallAfterMs={1000} />
    );
    expect(container.querySelector('[data-stalled]')).toBeNull();
    act(() => {
      jest.advanceTimersByTime(1600);
    });
    expect(container.querySelector('[data-stalled]')).not.toBeNull();
    expect(screen.getByText('Waiting for response')).toBeInTheDocument();
  });

  it('calls onStop', async () => {
    const onStop = jest.fn();
    render(<AgentStatus onStop={onStop} stopLabel="Interrupt" />);
    await userEvent.click(screen.getByRole('button', { name: 'Interrupt' }));
    expect(onStop).toHaveBeenCalledTimes(1);
  });
});
