import React from 'react';
import { render, screen, userEvent } from '@mantine-tests/core';
import { waitFor } from '@testing-library/react';
import { MessageActions } from './MessageActions';

describe('MessageActions', () => {
  it('renders only the actions whose callbacks are set, per role', () => {
    const { unmount } = render(
      <MessageActions messageRole="user" text="Hi" onEdit={() => {}} onRetry={() => {}} />
    );
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Copy' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Rewind to here' })).not.toBeInTheDocument();
    unmount();

    render(
      <MessageActions
        messageRole="assistant"
        onRetry={() => {}}
        onBranch={() => {}}
        onEdit={() => {}}
      />
    );
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Branch from here' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Copy' })).not.toBeInTheDocument();
  });

  it('shows a loader while an async action is pending and blocks other actions', async () => {
    let resolve: () => void = () => {};
    const onRetry = jest.fn(() => new Promise<void>((done) => (resolve = done)));
    render(<MessageActions messageRole="assistant" onRetry={onRetry} onBranch={() => {}} />);

    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Branch from here' })).toBeDisabled();

    resolve();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Branch from here' })).not.toBeDisabled()
    );
  });

  it('sends a positive rating right away and thanks the user', async () => {
    const onFeedback = jest.fn();
    render(<MessageActions messageRole="assistant" onFeedback={onFeedback} />);

    await userEvent.click(screen.getByRole('button', { name: 'Good response' }));
    expect(onFeedback).toHaveBeenCalledWith('up');
    expect(screen.getByRole('button', { name: 'Good response' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(await screen.findByText('Thanks for your feedback')).toBeInTheDocument();
  });

  it('collects details after a negative rating', async () => {
    const onFeedback = jest.fn();
    render(<MessageActions messageRole="assistant" onFeedback={onFeedback} />);

    await userEvent.click(screen.getByRole('button', { name: 'Bad response' }));
    expect(onFeedback).not.toHaveBeenCalled();
    await userEvent.click(await screen.findByRole('checkbox', { name: 'Too slow' }));
    await userEvent.type(screen.getByRole('textbox', { name: 'Details' }), 'Took a minute');
    await userEvent.click(screen.getByRole('button', { name: 'Send feedback' }));

    expect(onFeedback).toHaveBeenCalledWith('down', {
      reasons: ['too-slow'],
      comment: 'Took a minute',
    });
    expect(await screen.findByText('Thanks for your feedback')).toBeInTheDocument();
  });

  it('respects a controlled rating and disables actions', () => {
    render(
      <MessageActions
        messageRole="assistant"
        text="Answer"
        feedback="down"
        disabled
        onFeedback={() => {}}
        onRetry={() => {}}
      />
    );
    expect(screen.getByRole('button', { name: 'Bad response' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(screen.getByRole('button', { name: 'Retry' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Copy' })).not.toBeDisabled();
  });
  it('opens the negative feedback form when the rating is controlled', async () => {
    const onFeedback = jest.fn();
    render(<MessageActions messageRole="assistant" feedback={null} onFeedback={onFeedback} />);

    await userEvent.click(screen.getByRole('button', { name: 'Bad response' }));
    expect(await screen.findByText('What went wrong?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Bad response' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  });
});
