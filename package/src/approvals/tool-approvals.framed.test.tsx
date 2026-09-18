import React from 'react';
import { render, screen } from '@mantine-tests/core';
import { ToolApprovalSlot, ToolApprovalsProvider } from './tool-approvals';

describe('approvals/framed slot', () => {
  const approvals = {
    c1: {
      onApprove: () => {},
      reason: 'Создать задачу — title: Проверить отчёт',
      requestedBy: { name: 'tracker' },
    },
  };

  it('keeps the reason, the server badge and the buttons inside a frame', () => {
    render(
      <ToolApprovalsProvider approvals={approvals}>
        <ToolApprovalSlot toolCallId="c1" framed>
          <div>Создать задачу</div>
        </ToolApprovalSlot>
      </ToolApprovalsProvider>
    );

    expect(screen.getByText('tracker')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument();
    expect(screen.getByText('Создать задачу — title: Проверить отчёт')).toBeInTheDocument();
  });

  it('shows the reason of a card that carries its own frame', () => {
    render(
      <ToolApprovalsProvider approvals={approvals}>
        <ToolApprovalSlot toolCallId="c1">
          <div>Bash card</div>
        </ToolApprovalSlot>
      </ToolApprovalsProvider>
    );

    expect(screen.getByText('Создать задачу — title: Проверить отчёт')).toBeInTheDocument();
  });
});
