import React from 'react';
import { render, screen } from '@mantine-tests/core';
import userEvent from '@testing-library/user-event';
import { AgentChat } from '../AgentChat/AgentChat';
import type { ChatMessage } from '../types';
import type { ToolApprovals } from './tool-approvals';

const messages: ChatMessage[] = [
  {
    id: 'm1',
    role: 'assistant',
    parts: [
      {
        type: 'tool-mcp__tracker__create_issue',
        toolCallId: 'call-1',
        state: 'input-available',
        input: { title: 'Flaky upload test' },
      },
    ],
  },
];

function renderChat(approvals?: ToolApprovals) {
  return render(
    <AgentChat
      messages={messages}
      status="ready"
      onSend={() => {}}
      onStop={() => {}}
      approvals={approvals}
    />
  );
}

describe('approvals/ToolApprovalSlot', () => {
  it('shows the footer of a pending approval next to its call', async () => {
    const onApprove = jest.fn();
    renderChat({
      'call-1': { reason: 'Creates an issue in the tracker', isPending: true, onApprove },
    });

    expect(screen.getByText('Creates an issue in the tracker')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(onApprove).toHaveBeenCalledWith();
  });

  it('shows the outcome of a settled approval instead of the buttons', () => {
    renderChat({
      'call-1': {
        reason: 'Creates an issue in the tracker',
        outcome: { decision: 'approved', scope: 'session' },
      },
    });

    expect(screen.getByTestId('tool-approval-outcome')).toHaveTextContent('Approved · session');
    expect(screen.queryByRole('button', { name: 'Next' })).not.toBeInTheDocument();
    expect(screen.queryByText('Creates an issue in the tracker')).not.toBeInTheDocument();
  });

  it('ignores an id without a call and renders nothing without approvals', () => {
    renderChat({ 'call-missing': { reason: 'Nothing to attach to' } });
    expect(screen.queryByText('Nothing to attach to')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Next' })).not.toBeInTheDocument();

    renderChat();
    expect(screen.queryByRole('button', { name: 'Next' })).not.toBeInTheDocument();
  });
});
