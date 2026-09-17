import React from 'react';
import { render, screen, userEvent } from '@mantine-tests/core';
import { waitFor } from '@testing-library/react';
import { EditMessageComposer } from './EditMessageComposer';

describe('EditMessageComposer', () => {
  it('resends the trimmed text with Enter and keeps Shift+Enter as a new line', async () => {
    const onSubmit = jest.fn();
    render(<EditMessageComposer defaultValue="Hello" onSubmit={onSubmit} onCancel={() => {}} />);

    const input = screen.getByRole('textbox', { name: 'Edit message' });
    await userEvent.type(input, '{Shift>}{Enter}{/Shift}world  ');
    expect(onSubmit).not.toHaveBeenCalled();
    await userEvent.type(input, '{Enter}');
    expect(onSubmit).toHaveBeenCalledWith('Hello\nworld');
  });

  it('cancels with Escape and disables saving an empty message', async () => {
    const onCancel = jest.fn();
    render(<EditMessageComposer defaultValue="Hi" onSubmit={() => {}} onCancel={onCancel} />);

    const input = screen.getByRole('textbox', { name: 'Edit message' });
    await userEvent.clear(input);
    expect(screen.getByRole('button', { name: 'Save & resend' })).toBeDisabled();
    await userEvent.type(input, '{Escape}');
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('shows the error when resending fails', async () => {
    const onSubmit = jest.fn().mockRejectedValue(new Error('Rate limited'));
    render(<EditMessageComposer defaultValue="Hi" onSubmit={onSubmit} onCancel={() => {}} />);

    await userEvent.click(screen.getByRole('button', { name: 'Save & resend' }));
    expect(await screen.findByText('Rate limited')).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Save & resend' })).not.toBeDisabled()
    );
  });
});
