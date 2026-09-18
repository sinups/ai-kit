import React from 'react';
import { render, screen } from '@mantine-tests/core';
import { ToolActivity } from './ToolActivity';

describe('tools/ToolActivity', () => {
  it('renders nothing without progress and without elapsed time', () => {
    const { container } = render(<ToolActivity />);
    expect(container.querySelector('[data-tool-elapsed], [data-tool-progress]')).toBeNull();
  });

  it('shows the share of the work, the message and the elapsed time', () => {
    const { container } = render(
      <ToolActivity elapsed="12s" progress={{ progress: 3, total: 10, message: 'Reading tasks' }} />
    );

    expect(screen.getByText('30%')).toBeInTheDocument();
    expect(screen.getByText('Reading tasks')).toBeInTheDocument();
    expect(screen.getByText('12s')).toBeInTheDocument();
    expect(container.querySelector('.mantine-Progress-root')).toBeInTheDocument();
  });

  it('shows the raw count without a bar while the server reports no total', () => {
    const { container } = render(<ToolActivity progress={{ progress: 7 }} />);

    expect(screen.getByText('7')).toBeInTheDocument();
    expect(container.querySelector('.mantine-Progress-root')).toBeNull();
  });
});
