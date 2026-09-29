import React from 'react';
import { render, screen, userEvent } from '@mantine-tests/core';
import { fireEvent } from '@testing-library/react';
import { ToolApprovalCard } from './ToolApprovalCard';

const call = {
  tool: { name: 'Find Jobs' },
  server: { name: 'Upwork', icon: <span data-testid="server-icon" /> },
  params: { action: 'smart_search', params: { limit: 10, mode: 'best_match' } },
};

describe('approvals/ToolApprovalCard', () => {
  it('names the tool, the server and the arguments of the call', () => {
    render(<ToolApprovalCard {...call} onDecline={jest.fn()} onAllowOnce={jest.fn()} />);

    expect(
      screen.getByRole('group', { name: 'The agent wants to use Find Jobs from Upwork' })
    ).toBeInTheDocument();
    expect(screen.getByTestId('server-icon')).toBeInTheDocument();
    expect(screen.getByText('Params limit')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('smart_search')).toBeInTheDocument();
  });

  it('answers with the button that was pressed and then keeps still', async () => {
    const onAllowOnce = jest.fn();
    const onAlwaysAllow = jest.fn();
    render(
      <ToolApprovalCard
        {...call}
        onDecline={jest.fn()}
        onAllowOnce={onAllowOnce}
        onAlwaysAllow={onAlwaysAllow}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: /Allow once/ }));
    expect(onAllowOnce).toHaveBeenCalledTimes(1);

    await userEvent.click(screen.getByRole('button', { name: /Always allow/ }));
    expect(onAlwaysAllow).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /Allow once/ })).toBeDisabled();
  });

  it.each([
    ['once', { key: 'Enter', metaKey: true }],
    ['always', { key: 'Enter', metaKey: true, shiftKey: true }],
    ['decline', { key: 'Escape' }],
  ])('takes the %s answer from the keyboard', (answer, event) => {
    const handlers = {
      onDecline: jest.fn(),
      onAllowOnce: jest.fn(),
      onAlwaysAllow: jest.fn(),
    };
    render(<ToolApprovalCard {...call} {...handlers} />);

    fireEvent.keyDown(document, event);
    const called = {
      once: handlers.onAllowOnce,
      always: handlers.onAlwaysAllow,
      decline: handlers.onDecline,
    }[answer as 'once' | 'always' | 'decline'];
    expect(called).toHaveBeenCalledTimes(1);
    expect(
      [handlers.onDecline, handlers.onAllowOnce, handlers.onAlwaysAllow].filter(
        (handler) => handler.mock.calls.length > 0
      )
    ).toHaveLength(1);
  });

  it('listens to the keyboard only while nothing is decided', () => {
    const onDecline = jest.fn();
    render(<ToolApprovalCard {...call} decision="declined" onDecline={onDecline} />);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onDecline).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Decline' })).toBeDisabled();
  });

  it('gives up the shortcuts when the host asks', () => {
    const onAllowOnce = jest.fn();
    render(<ToolApprovalCard {...call} shortcuts={false} onAllowOnce={onAllowOnce} />);

    fireEvent.keyDown(document, { key: 'Enter', metaKey: true });
    expect(onAllowOnce).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Allow once' })).toBeInTheDocument();
  });

  it('folds the arguments away and back', async () => {
    render(<ToolApprovalCard {...call} onAllowOnce={jest.fn()} />);

    const toggle = screen.getByRole('button', { name: 'Arguments of the call' });
    expect(toggle).toHaveAttribute('aria-expanded', 'true');

    await userEvent.click(toggle);
    expect(screen.getByRole('button', { name: 'Arguments of the call' })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
  });

  it('drops the toggle and the server when there is nothing to show', () => {
    render(<ToolApprovalCard tool={{ name: 'Find Jobs' }} onAllowOnce={jest.fn()} />);

    expect(
      screen.getByRole('group', { name: 'The agent wants to use Find Jobs' })
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Arguments of the call' })).toBeNull();
    expect(screen.queryByRole('button', { name: /Always allow/ })).toBeNull();
  });
});
