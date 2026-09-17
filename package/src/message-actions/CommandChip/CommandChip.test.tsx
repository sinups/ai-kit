import React from 'react';
import { render, screen } from '@mantine-tests/core';
import { CommandChip } from './CommandChip';

describe('message-actions/CommandChip', () => {
  it('renders the command name without the slash and its arguments', () => {
    const { container } = render(<CommandChip name="/review" args="src/auth" />);
    expect(screen.getByText('review')).toBeInTheDocument();
    expect(screen.getByText('src/auth')).toBeInTheDocument();
    expect(container.querySelector('[data-command="review"]')).not.toBeNull();
  });
});
