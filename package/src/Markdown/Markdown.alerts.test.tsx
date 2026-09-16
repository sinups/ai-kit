import React from 'react';
import { render, screen } from '@mantine-tests/core';
import { Markdown } from './Markdown';

describe('Markdown GitHub alerts', () => {
  it('renders multi-line alert blockquotes instead of throwing', () => {
    render(<Markdown content={'> [!TIP]\n> Use the `className` prop.'} />);
    expect(screen.getByText('Tip')).toBeInTheDocument();
    expect(screen.getByText('className')).toBeInTheDocument();
  });
});
