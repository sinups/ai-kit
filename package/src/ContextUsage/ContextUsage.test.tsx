import React from 'react';
import { render, screen } from '@mantine-tests/core';
import { act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContextUsage } from './ContextUsage';

describe('ContextUsage/ContextUsage', () => {
  it('exposes the level and percentage', () => {
    const { container } = render(<ContextUsage used={170_000} total={200_000} withLabel />);
    expect(container.querySelector('[data-level="warning"]')).not.toBeNull();
    expect(screen.getByText('85%')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Context usage: 85%' })).toBeInTheDocument();
  });

  it('shows the breakdown and compact action on click', async () => {
    const onCompact = jest.fn();
    render(
      <ContextUsage
        used={196_000}
        total={200_000}
        segments={[
          { label: 'System', value: 6000 },
          { label: 'Messages', value: 190_000 },
        ]}
        onCompact={onCompact}
      />
    );
    await userEvent.click(screen.getByRole('button', { name: /Context usage/ }));
    expect(await screen.findByText('196k / 200k tokens · 98%')).toBeInTheDocument();
    expect(screen.getByText('Messages')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Compact conversation' }));
    expect(onCompact).toHaveBeenCalledTimes(1);
  });

  it('keeps the details open while the pointer moves from the trigger into them', async () => {
    jest.useFakeTimers();
    try {
      render(<ContextUsage used={1000} total={200_000} />);
      const trigger = screen.getByRole('button', { name: /Context usage/ });
      fireEvent.mouseEnter(trigger);
      const details = await screen.findByText('1k / 200k tokens · <1%');
      fireEvent.mouseLeave(trigger);
      fireEvent.mouseEnter(details);
      act(() => {
        jest.advanceTimersByTime(500);
      });
      expect(screen.getByText('1k / 200k tokens · <1%')).toBeInTheDocument();
    } finally {
      jest.useRealTimers();
    }
  });

  it('hides the compact action below the warning threshold', async () => {
    render(<ContextUsage used={1000} total={200_000} onCompact={() => {}} />);
    await userEvent.click(screen.getByRole('button', { name: /Context usage/ }));
    expect(await screen.findByText('1k / 200k tokens · <1%')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Compact conversation' })).toBeNull();
  });
});
