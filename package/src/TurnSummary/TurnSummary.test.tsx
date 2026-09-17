import React from 'react';
import { render, screen } from '@mantine-tests/core';
import { TurnSummary } from './TurnSummary';

describe('TurnSummary', () => {
  it('renders the summary line with overridable labels', () => {
    const { rerender } = render(
      <TurnSummary durationMs={123_000} tokens={40_000} tokenBudget={100_000} backgroundTasks={2} />
    );
    expect(screen.getByText('Took 2m 3s · 40k / 100k · 2 tasks left running')).toBeInTheDocument();

    rerender(<TurnSummary durationMs={5000} labels={{ worked: (d) => `Ran ${d}` }} />);
    expect(screen.getByText('Ran 5s')).toBeInTheDocument();
  });
});
