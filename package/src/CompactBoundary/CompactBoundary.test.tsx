import React from 'react';
import { render, screen } from '@mantine-tests/core';
import userEvent from '@testing-library/user-event';
import { CompactBoundary } from './CompactBoundary';

describe('CompactBoundary', () => {
  it('shows the label with the token change', () => {
    render(<CompactBoundary tokensBefore={182_400} tokensAfter={12_300} />);
    expect(screen.getByText('History summarized · 182k → 12.3k tokens')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('toggles the summary', async () => {
    render(<CompactBoundary label="History trimmed" summary="Kept **decisions** only" />);
    const toggle = screen.getByRole('button', { name: /History trimmed/ });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('decisions')).toBeInTheDocument();
  });
  it('labels the summarized side and shows the kept context', async () => {
    const { rerender } = render(<CompactBoundary direction="from" tokensAfter={9_800} />);
    expect(screen.getByText('Summarized from here · 9.8k tokens')).toBeInTheDocument();

    rerender(<CompactBoundary direction="from" tokensAfter={9_800} tokensLabel="{tokens} left" />);
    expect(screen.getByText('Summarized from here · 9.8k left')).toBeInTheDocument();

    rerender(<CompactBoundary direction="up-to" userContext="decisions about auth" />);
    const toggle = screen.getByRole('button', { name: /Summarized up to here/ });
    await userEvent.click(toggle);
    expect(screen.getByText('Kept: decisions about auth')).toBeInTheDocument();

    rerender(<CompactBoundary direction="up-to" label="Earlier turns summarized" />);
    expect(screen.getByText('Earlier turns summarized')).toBeInTheDocument();
  });
});
