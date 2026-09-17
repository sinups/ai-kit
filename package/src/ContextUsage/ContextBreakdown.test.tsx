import React from 'react';
import { render, screen, userEvent } from '@mantine-tests/core';
import { ContextBreakdown } from './ContextBreakdown';
import { ContextUsage } from './ContextUsage';
import { CONTEXT_GROUPS, CONTEXT_SUGGESTIONS } from './fixtures';

describe('ContextBreakdown', () => {
  it('summarizes groups and expands a group into items', async () => {
    const user = userEvent.setup({ delay: null });
    render(<ContextBreakdown groups={CONTEXT_GROUPS} total={200_000} />);

    expect(screen.getByText('140k / 200k tokens · 70%')).toBeInTheDocument();
    const mcp = screen.getByRole('button', { name: /MCP tools/ });
    expect(mcp).toHaveTextContent('26.9k');
    expect(screen.queryByRole('button', { name: /System/ })).not.toBeInTheDocument();
    expect(screen.getByText('System')).toBeInTheDocument();

    await user.click(mcp);
    expect(mcp).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getAllByText(/unused this week/)).toHaveLength(3);
    const labels = screen
      .getAllByText(/^(git|issues|postgres|errors)$/)
      .map((node) => node.textContent?.split(' · ')[0]);
    expect(labels).toEqual(['git', 'issues', 'postgres', 'errors']);
  });

  it('orders suggestions by severity and runs their actions', async () => {
    const user = userEvent.setup({ delay: null });
    const onReview = jest.fn();
    const suggestions = CONTEXT_SUGGESTIONS.map((suggestion) =>
      suggestion.action?.label === 'Review servers'
        ? { ...suggestion, action: { label: 'Review servers', onClick: onReview } }
        : suggestion
    );
    render(<ContextBreakdown groups={CONTEXT_GROUPS} total={200_000} suggestions={suggestions} />);

    const titles = Array.from(document.querySelectorAll('[data-severity]')).map((node) =>
      node.getAttribute('data-severity')
    );
    expect(titles).toEqual(['critical', 'warning', 'info']);
    expect(screen.getByText('frees about 12.1k tokens')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Review servers' }));
    expect(onReview).toHaveBeenCalledTimes(1);
  });

  it('renders the breakdown inside the ContextUsage details', async () => {
    const user = userEvent.setup({ delay: null });
    render(
      <ContextUsage
        used={139_800}
        total={200_000}
        breakdown={CONTEXT_GROUPS}
        suggestions={CONTEXT_SUGGESTIONS}
      />
    );

    await user.click(screen.getByRole('button', { name: /Context usage/ }));
    expect(await screen.findByText('140k / 200k tokens · 70%')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Memory files/ })).toBeInTheDocument();
    expect(screen.getByText('Disable 3 unused MCP servers')).toBeInTheDocument();
  });
});
