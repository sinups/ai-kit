import React from 'react';
import { render, screen, userEvent } from '@mantine-tests/core';
import { ToolUnavailableNotice } from './ToolUnavailableNotice';

describe('ChatNotices/ToolUnavailableNotice', () => {
  it('names the server and runs the actions', async () => {
    const user = userEvent.setup({ delay: null });
    const onRetry = jest.fn();
    const onDismiss = jest.fn();
    render(
      <ToolUnavailableNotice
        server="tracker"
        message="The connection dropped after three attempts."
        onRetry={onRetry}
        onDismiss={onDismiss}
      />
    );

    expect(screen.getByText('tracker is unavailable.')).toBeInTheDocument();
    expect(screen.getByText('The connection dropped after three attempts.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    await user.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('falls back to a title without a server and hides optional buttons', () => {
    render(<ToolUnavailableNotice message="The tool is no longer registered." />);

    expect(screen.getByText('A tool is unavailable.')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('uses labels', () => {
    render(
      <ToolUnavailableNotice
        server="postgres"
        message="Reconnecting."
        onRetry={() => {}}
        labels={{ title: 'No answer from {server}', retry: 'Reconnect' }}
      />
    );

    expect(screen.getByText('No answer from postgres')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reconnect' })).toBeInTheDocument();
  });
});
