import React from 'react';
import { render, screen, userEvent } from '@mantine-tests/core';
import { ContextEventRow } from './ContextEventRow';

describe('ContextEventRow', () => {
  it('renders the verb and object and expands to the items', async () => {
    render(
      <ContextEventRow
        kind="directory"
        label="src/auth"
        detail="3 files"
        items={['a.ts', 'b.ts']}
      />
    );
    expect(screen.getByText('Listed')).toBeInTheDocument();
    expect(screen.getByText('src/auth · 3 files')).toBeInTheDocument();
    const toggle = screen.getByRole('button');
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('a.ts')).toBeInTheDocument();
  });

  it('is a static row without items', () => {
    render(<ContextEventRow kind="skill" label="pdf" labels={{ skill: 'Using skill' }} />);
    expect(screen.getByText('Using skill')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
