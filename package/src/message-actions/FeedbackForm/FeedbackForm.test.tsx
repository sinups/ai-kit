import React from 'react';
import { render, screen, userEvent } from '@mantine-tests/core';
import { FeedbackForm } from './FeedbackForm';

describe('message-actions/FeedbackForm', () => {
  it('requires a reason or a comment and shows the rejection message', async () => {
    const onSubmit = jest.fn().mockRejectedValueOnce(new Error('Network down'));
    render(<FeedbackForm value="down" onSubmit={onSubmit} />);

    const submit = screen.getByRole('button', { name: 'Send feedback' });
    expect(submit).toBeDisabled();
    await userEvent.click(screen.getByRole('checkbox', { name: 'Inaccurate' }));
    await userEvent.click(submit);

    expect(onSubmit).toHaveBeenCalledWith({ reasons: ['inaccurate'], comment: '' });
    expect(await screen.findByText('Network down')).toBeInTheDocument();
    expect(screen.queryByText('Thanks for your feedback')).not.toBeInTheDocument();
  });

  it('skips without details and renders the thank-you note for positive ratings', async () => {
    const onSkip = jest.fn();
    const { unmount } = render(<FeedbackForm value="down" onSkip={onSkip} />);
    await userEvent.click(screen.getByRole('button', { name: 'Skip' }));
    expect(onSkip).toHaveBeenCalled();
    expect(await screen.findByText('Thanks for your feedback')).toBeInTheDocument();
    unmount();

    render(<FeedbackForm value="up" labels={{ thanks: 'Glad it helped' }} />);
    expect(screen.getByText('Glad it helped')).toBeInTheDocument();
  });
});
