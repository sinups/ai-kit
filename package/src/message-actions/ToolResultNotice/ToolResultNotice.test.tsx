import React from 'react';
import { render, screen, userEvent } from '@mantine-tests/core';
import { ToolResultNotice } from './ToolResultNotice';

describe('ToolResultNotice', () => {
  it('expands a rejected call to the user feedback', async () => {
    render(
      <ToolResultNotice
        variant="rejected"
        toolName="Edit"
        detail="src/auth.ts"
        feedback="Keep the old API"
      />
    );
    expect(screen.getByText('Rejected')).toBeInTheDocument();
    expect(screen.getByText('Edit src/auth.ts')).toBeInTheDocument();

    const toggle = screen.getByRole('button');
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Keep the old API')).toBeInTheDocument();
  });

  it('shows the error output of a failed call and is static without details', () => {
    const { unmount } = render(
      <ToolResultNotice variant="error" toolName="Bash" errorText="exit 1" defaultExpanded />
    );
    expect(screen.getByText('Failed')).toBeInTheDocument();
    expect(screen.getByText('exit 1')).toBeInTheDocument();
    unmount();

    render(<ToolResultNotice variant="cancelled" toolName="Bash" errorText="ignored" />);
    expect(screen.getByText('Cancelled')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
