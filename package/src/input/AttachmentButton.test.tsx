import React from 'react';
import { render, screen } from '@mantine-tests/core';
import { AttachmentButton } from './AttachmentButton';

describe('input/AttachmentButton', () => {
  it('takes the accessible name from labels', () => {
    const { rerender } = render(<AttachmentButton />);
    expect(screen.getByRole('button', { name: 'Attach' })).toBeInTheDocument();

    rerender(<AttachmentButton labels={{ attach: 'Anhängen' }} />);
    expect(screen.getByRole('button', { name: 'Anhängen' })).toBeInTheDocument();
  });
});
