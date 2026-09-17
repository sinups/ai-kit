import React from 'react';
import { render, screen } from '@mantine-tests/core';
import { act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorMessage } from './ErrorMessage';

describe('ErrorMessage', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders title and message only by default', () => {
    render(<ErrorMessage message="Boom" />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Boom')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('counts down to the next retry attempt', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    render(
      <ErrorMessage
        message="Overloaded"
        retry={{ attempt: 2, maxAttempts: 10, retryAt: Date.now() + 2000 }}
      />
    );
    expect(screen.getByText('Next try in 2s · 2 of 10')).toBeInTheDocument();
    expect(screen.queryAllByText(/Trying again/)).toHaveLength(0);
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    expect(screen.getAllByText('Trying again · 2 of 10')).toHaveLength(2);
  });

  it('calls onRetry and shows the reset time', async () => {
    const onRetry = jest.fn();
    render(
      <ErrorMessage
        variant="warning"
        message="Limit"
        resetsAt={new Date('2026-01-01T14:05:00')}
        onRetry={onRetry}
        retryLabel="Try again"
        resetsAtLabel={(time) => `Resets ${time}`}
      />
    );
    expect(screen.getByText(/^Resets /)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('shows a long message in full unless collapsible', () => {
    const message = Array.from({ length: 10 }, (_, index) => `at frame ${index}`).join('\n');
    render(<ErrorMessage message={message} />);
    expect(screen.getByText(/at frame 9$/)).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('collapses a long message behind Show more', async () => {
    const message = Array.from({ length: 10 }, (_, index) => `at frame ${index}`).join('\n');
    render(<ErrorMessage message={message} collapsible />);
    expect(screen.getByText(/at frame 5…$/)).toBeInTheDocument();
    expect(screen.queryByText(/at frame 9/)).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Show more' }));
    expect(screen.getByText(/at frame 9$/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Show less' }));
    expect(screen.queryByText(/at frame 9/)).not.toBeInTheDocument();
  });
});
