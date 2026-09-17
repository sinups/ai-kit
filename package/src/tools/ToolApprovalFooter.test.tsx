import React from 'react';
import { render, screen } from '@mantine-tests/core';
import { act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToolApprovalFooter } from './ToolApprovalFooter';

describe('tools/ToolApprovalFooter', () => {
  it('approves without a scope from the main button', async () => {
    const onApprove = jest.fn();
    render(<ToolApprovalFooter onApprove={onApprove} reason="Writes to disk" />);
    expect(screen.getByText('Writes to disk')).toBeInTheDocument();
    await userEvent.click(screen.getByText('Next'));
    expect(onApprove).toHaveBeenCalledWith();
    expect(screen.getByText('Approved')).toBeInTheDocument();
    expect(screen.queryByText('Writes to disk')).not.toBeInTheDocument();
  });

  it('shows Starting only after approval while pending and renders nothing once complete', async () => {
    const { rerender } = render(<ToolApprovalFooter isPending reason="Runs yarn build" />);
    expect(screen.queryByText('Starting')).not.toBeInTheDocument();
    expect(screen.getByText('Runs yarn build')).toBeInTheDocument();

    await userEvent.click(screen.getByText('Next'));
    expect(screen.getByText('Starting')).toBeInTheDocument();

    rerender(<ToolApprovalFooter isComplete reason="Runs yarn build" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByText('Runs yarn build')).not.toBeInTheDocument();
  });

  it('uses the decision and status labels', async () => {
    render(
      <ToolApprovalFooter
        isPending
        approveLabel="Run"
        approvedLabel="Allowed"
        startingLabel="Launching"
      />
    );
    await userEvent.click(screen.getByRole('button', { name: 'Run' }));
    expect(screen.getByText('Allowed')).toBeInTheDocument();
    expect(screen.getByText('Launching')).toBeInTheDocument();
  });

  it('approves with the scope picked from the menu', async () => {
    const onApprove = jest.fn();
    render(
      <ToolApprovalFooter
        onApprove={onApprove}
        approveOptions={[
          { value: 'once', label: 'Allow once' },
          { value: 'session', label: 'Allow for this session' },
        ]}
      />
    );
    await userEvent.click(screen.getByLabelText('More approval options'));
    await userEvent.click(await screen.findByText('Allow for this session'));
    expect(onApprove).toHaveBeenCalledWith('session');
  });

  it('rejects with typed feedback', async () => {
    const onRejectWithFeedback = jest.fn();
    const onReject = jest.fn();
    render(<ToolApprovalFooter onReject={onReject} onRejectWithFeedback={onRejectWithFeedback} />);
    await userEvent.click(screen.getByLabelText('More approval options'));
    await userEvent.click(await screen.findByText('Reject with feedback'));
    await userEvent.type(
      screen.getByRole('textbox', { name: 'Reject with feedback' }),
      'use yarn{Enter}'
    );
    expect(onRejectWithFeedback).toHaveBeenCalledWith('use yarn');
    expect(onReject).not.toHaveBeenCalled();
    expect(screen.getByText('Canceled')).toBeInTheDocument();
  });
  it('loads the explanation once and toggles it', async () => {
    let resolve: (value: {
      risk: 'high';
      explanation: string;
      reasoning: string;
    }) => void = () => {};
    const onExplain = jest.fn(
      () =>
        new Promise<{ risk: 'high'; explanation: string; reasoning: string }>(
          (done) => (resolve = done)
        )
    );
    render(<ToolApprovalFooter onApprove={jest.fn()} onExplain={onExplain} />);

    await userEvent.click(screen.getByRole('button', { name: 'Why?' }));
    expect(screen.getByRole('button', { name: 'Why?' })).toHaveAttribute('data-loading', 'true');
    await act(async () =>
      resolve({
        risk: 'high',
        explanation: 'Deletes the build folder',
        reasoning: 'rm -rf is recursive',
      })
    );

    expect(await screen.findByText('High risk')).toBeInTheDocument();
    expect(screen.getByText('Deletes the build folder')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Why?' })).toHaveAttribute('aria-expanded', 'true');
    await userEvent.click(screen.getByRole('button', { name: 'Show reasoning', hidden: true }));
    expect(screen.getByRole('button', { name: 'Hide reasoning', hidden: true })).toHaveAttribute(
      'aria-expanded',
      'true'
    );

    await userEvent.click(screen.getByRole('button', { name: 'Why?' }));
    expect(screen.getByRole('button', { name: 'Why?' })).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(screen.getByRole('button', { name: 'Why?' }));
    expect(onExplain).toHaveBeenCalledTimes(1);
  });

  it('shows an explanation error with retry', async () => {
    const onExplain = jest
      .fn()
      .mockRejectedValueOnce(new Error('Model unavailable'))
      .mockResolvedValueOnce({ risk: 'low', explanation: 'Reads a file' });
    render(<ToolApprovalFooter onExplain={onExplain} riskLabels={{ low: 'Safe' }} />);

    await userEvent.click(screen.getByRole('button', { name: 'Why?' }));
    expect(await screen.findByText('Model unavailable')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Retry', hidden: true }));
    expect(await screen.findByText('Safe')).toBeInTheDocument();
    expect(screen.queryByText('Model unavailable')).not.toBeInTheDocument();
    expect(onExplain).toHaveBeenCalledTimes(2);
  });

  it('edits the suggested rule before approving always', async () => {
    const onApprove = jest.fn();
    const onChange = jest.fn();
    render(
      <ToolApprovalFooter
        onApprove={onApprove}
        approveOptions={[{ value: 'once', label: 'Allow once' }]}
        ruleSuggestion={{ value: 'Bash(npm run test:*)', onChange }}
      />
    );

    await userEvent.click(screen.getByLabelText('More approval options'));
    await userEvent.click(await screen.findByText('Always allow'));
    expect(onApprove).not.toHaveBeenCalled();

    const input = screen.getByRole('textbox', { name: 'Permission rule' });
    expect(screen.getByText('Allow Bash commands starting with npm run test')).toBeInTheDocument();
    await userEvent.clear(input);
    await userEvent.type(input, 'Bash(npm');
    expect(screen.getByText('Close the parenthesis')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeDisabled();

    await userEvent.type(input, ' run lint)');
    expect(onChange).toHaveBeenLastCalledWith('Bash(npm run lint)');
    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(onApprove).toHaveBeenCalledWith('always');
    expect(screen.getByText('Approved')).toBeInTheDocument();
  });

  it('shows the matched rule and the requesting agent', () => {
    render(
      <ToolApprovalFooter
        reason="Runs a shell command"
        matchedRule="Bash(git push:*)"
        requestedBy={{ name: 'test-runner', color: 'teal' }}
      />
    );
    expect(screen.getByText('Runs a shell command')).toBeInTheDocument();
    expect(screen.getByText(/Asked because:/)).toHaveTextContent('Asked because: Bash(git push:*)');
    expect(screen.getByText('test-runner')).toBeInTheDocument();
  });
});
