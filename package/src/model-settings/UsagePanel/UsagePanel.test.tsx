import React from 'react';
import { render, screen, userEvent } from '@mantine-tests/core';
import { UsagePanel } from './UsagePanel';

describe('model-settings/UsagePanel', () => {
  it('renders totals, limit levels with reset time, models and days', async () => {
    const onPeriodChange = jest.fn();
    const { container } = render(
      <UsagePanel
        period="week"
        onPeriodChange={onPeriodChange}
        now={new Date('2026-09-17T10:00:00Z')}
        summary={{ tokens: 1_250_000, cost: 12.5, requests: 320 }}
        limits={[
          {
            id: 'session',
            label: '5-hour limit',
            used: 92,
            limit: 100,
            unit: 'requests',
            resetsAt: '2026-09-17T12:00:00Z',
          },
          { id: 'weekly', label: 'Weekly', used: 10, limit: 100, unit: 'requests' },
        ]}
        models={[{ model: 'Qwen 2.5 Coder 32B', tokens: 900_000, cost: 10 }]}
        daily={[
          { date: '2026-09-16', tokens: 500_000 },
          { date: '2026-09-15', tokens: 250_000 },
        ]}
      />
    );

    expect(screen.getByText('1.3M')).toBeInTheDocument();
    expect(screen.getByText('$12.50')).toBeInTheDocument();
    expect(screen.getByText('Resets in 2h')).toBeInTheDocument();
    expect(container.querySelector('[data-level="danger"]')).toHaveTextContent('5-hour limit');
    expect(container.querySelector('[data-level="normal"]')).toHaveTextContent('Weekly');
    expect(screen.getByText('Qwen 2.5 Coder 32B')).toBeInTheDocument();
    const days = screen.getAllByText(/^Sep 1[56]$/).map((node) => node.textContent);
    expect(days).toEqual(['Sep 15', 'Sep 16']);

    await userEvent.click(screen.getByRole('radio', { name: 'Month' }));
    expect(onPeriodChange).toHaveBeenCalledWith('month');
  });

  it('renders loading, error and empty states', async () => {
    const onRetry = jest.fn();
    const { rerender } = render(<UsagePanel period="day" loading />);
    expect(document.querySelector('[aria-busy="true"]')).not.toBeNull();

    rerender(<UsagePanel period="day" error="Usage unavailable" onRetry={onRetry} />);
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalled();

    rerender(<UsagePanel period="day" summary={{ tokens: 0 }} />);
    expect(screen.getByText('No usage yet')).toBeInTheDocument();
  });
});
