import React from 'react';
import { render, screen, userEvent } from '@mantine-tests/core';
import { waitFor } from '@testing-library/react';
import { ConfirmDialog } from './ConfirmDialog';

describe('primitives/ConfirmDialog', () => {
  it('confirms, shows pending and closes after the promise resolves', async () => {
    let resolve: () => void = () => {};
    const onConfirm = jest.fn(() => new Promise<void>((done) => (resolve = done)));
    const onClose = jest.fn();
    render(
      <ConfirmDialog
        opened
        danger
        title="Delete rule"
        message="Bash(npm run test:*) will be removed."
        labels={{ confirm: 'Delete' }}
        onConfirm={onConfirm}
        onClose={onClose}
      />
    );

    expect(await screen.findByText('Bash(npm run test:*) will be removed.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(screen.getByRole('button', { name: 'Delete' })).toHaveAttribute('data-loading', 'true');
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    expect(onClose).not.toHaveBeenCalled();

    resolve();
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  it('keeps the dialog open and shows a rejection', async () => {
    const onClose = jest.fn();
    render(
      <ConfirmDialog
        opened
        title="Remove directory"
        onConfirm={() => Promise.reject(new Error('Permission denied'))}
        onClose={onClose}
      />
    );

    await userEvent.click(await screen.findByRole('button', { name: 'Confirm' }));
    expect(await screen.findByText('Permission denied')).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
