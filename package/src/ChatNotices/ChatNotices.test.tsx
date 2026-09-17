import React from 'react';
import { render, screen, userEvent } from '@mantine-tests/core';
import { IdleReturnPrompt } from './IdleReturnPrompt';
import { SpendThresholdNotice } from './SpendThresholdNotice';

describe('ChatNotices/IdleReturnPrompt', () => {
  it('describes the absence and runs the actions', async () => {
    const user = userEvent.setup({ delay: null });
    const onContinue = jest.fn();
    const onNewChat = jest.fn();
    const onDontAskAgain = jest.fn();
    render(
      <IdleReturnPrompt
        awayMs={3 * 3_600_000 + 60_000}
        tokens={180_000}
        onContinue={onContinue}
        onNewChat={onNewChat}
        onDontAskAgain={onDontAskAgain}
      />
    );

    expect(screen.getByText('Welcome back, 3h since your last message.')).toBeInTheDocument();
    expect(
      screen.getByText('This chat already holds 180k tokens. Keep going here or start fresh?')
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await user.click(screen.getByRole('button', { name: 'New chat with this message' }));
    await user.click(screen.getByRole('button', { name: 'Stop asking' }));
    expect(onContinue).toHaveBeenCalledTimes(1);
    expect(onNewChat).toHaveBeenCalledTimes(1);
    expect(onDontAskAgain).toHaveBeenCalledTimes(1);
  });

  it('hides optional actions and uses labels', () => {
    render(
      <IdleReturnPrompt
        awayMs={45 * 60_000}
        onContinue={() => {}}
        labels={{ title: 'Away for {duration}', continue: 'Keep going' }}
      />
    );
    expect(screen.getByText('Away for 45m')).toBeInTheDocument();
    expect(screen.getByText('Keep going here or start fresh?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Keep going' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Stop asking' })).not.toBeInTheDocument();
  });
});

describe('ChatNotices/SpendThresholdNotice', () => {
  it('formats the spend and limit and runs actions', async () => {
    const user = userEvent.setup({ delay: null });
    const onViewUsage = jest.fn();
    const onDismiss = jest.fn();
    render(
      <SpendThresholdNotice
        amount={5.2}
        limit={10}
        actions={[{ label: 'View usage', onClick: onViewUsage, kind: 'primary' }]}
        onDismiss={onDismiss}
      />
    );

    expect(screen.getByText('Session cost is now $5.20.')).toBeInTheDocument();
    expect(screen.getByText(/Your limit is \$10\.00\./)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'View usage' }));
    await user.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(onViewUsage).toHaveBeenCalledTimes(1);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('uses an explicit locale and currency', () => {
    render(<SpendThresholdNotice amount={12} currency="EUR" locale="de" />);
    expect(screen.getByText(/12,00\s€/)).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
