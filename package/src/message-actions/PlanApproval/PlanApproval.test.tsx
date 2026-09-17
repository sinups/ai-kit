import React from 'react';
import { render, screen, userEvent } from '@mantine-tests/core';
import { PlanApproval } from './PlanApproval';

const plan = {
  id: 'auth',
  title: 'Refactor auth',
  summary: '1. Extract token store\n2. Add tests',
};

describe('message-actions/PlanApproval', () => {
  it('approves the plan and renders the final state', async () => {
    const onApprove = jest.fn();
    render(<PlanApproval plan={plan} onApprove={onApprove} />);

    expect(screen.getByText('plan-auth.md')).toBeInTheDocument();
    expect(screen.getByText('Refactor auth')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Approve' }));

    expect(onApprove).toHaveBeenCalledTimes(1);
    expect(await screen.findByText('Approved')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Approve' })).not.toBeInTheDocument();
  });

  it('approves with edits', async () => {
    const onApproveWithEdits = jest.fn();
    render(
      <PlanApproval plan={plan} onApprove={() => {}} onApproveWithEdits={onApproveWithEdits} />
    );

    await userEvent.click(screen.getByRole('button', { name: 'Approve with edits' }));
    const submit = screen.getByRole('button', { name: 'Approve with edits' });
    expect(submit).toBeDisabled();
    await userEvent.type(screen.getByLabelText('Edits to the plan'), ' Skip step 2 ');
    await userEvent.click(submit);

    expect(onApproveWithEdits).toHaveBeenCalledWith('Skip step 2');
    expect(await screen.findByText('Approved with edits')).toBeInTheDocument();
    expect(screen.getByText('Skip step 2')).toBeInTheDocument();
  });

  it('keeps the feedback form open when rejecting fails and goes back', async () => {
    const onReject = jest.fn().mockRejectedValue(new Error('Session ended'));
    render(<PlanApproval plan={plan} onApprove={() => {}} onReject={onReject} />);

    await userEvent.click(screen.getByRole('button', { name: 'Reject with feedback' }));
    await userEvent.type(screen.getByLabelText('Why is the plan rejected?'), 'Too broad');
    await userEvent.click(screen.getByRole('button', { name: 'Reject' }));

    expect(onReject).toHaveBeenCalledWith('Too broad');
    expect(await screen.findByText('Session ended')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByRole('button', { name: 'Approve' })).toBeInTheDocument();
  });

  it('renders a controlled decision', () => {
    render(
      <PlanApproval
        plan={plan}
        onApprove={() => {}}
        decision={{ kind: 'rejected', feedback: 'Not now' }}
      />
    );
    expect(screen.getByText('Rejected')).toBeInTheDocument();
    expect(screen.getByText('Not now')).toBeInTheDocument();
  });
  it('approves with the first option or a mode picked from the menu', async () => {
    const options = [
      {
        value: 'auto-accept',
        label: 'Auto-accept edits',
        description: 'Apply edits without asking',
      },
      { value: 'manual', label: 'Manually approve edits' },
      { value: 'clear-context', label: 'Clear context and start' },
    ];
    const onApprove = jest.fn();
    const { unmount } = render(
      <PlanApproval plan={plan} approveOptions={options} onApprove={onApprove} />
    );

    await userEvent.click(screen.getByRole('button', { name: 'More approval options' }));
    expect(await screen.findByRole('menuitem', { name: /Auto-accept edits/ })).toHaveTextContent(
      'Apply edits without asking'
    );
    await userEvent.click(screen.getByRole('menuitem', { name: 'Clear context and start' }));
    expect(onApprove).toHaveBeenCalledWith('clear-context');
    expect(await screen.findByText('Approved · Clear context and start')).toBeInTheDocument();
    unmount();

    const onDefaultApprove = jest.fn();
    render(<PlanApproval plan={plan} approveOptions={options} onApprove={onDefaultApprove} />);
    await userEvent.click(screen.getByRole('button', { name: 'Approve' }));
    expect(onDefaultApprove).toHaveBeenCalledWith('auto-accept');
    expect(await screen.findByText('Approved · Auto-accept edits')).toBeInTheDocument();
  });

  it('keeps a single approve button without options', async () => {
    const onApprove = jest.fn();
    render(<PlanApproval plan={plan} onApprove={onApprove} />);
    expect(screen.queryByRole('button', { name: 'More approval options' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Approve' }));
    expect(onApprove).toHaveBeenCalledWith();
  });

  it('shows the mode of a controlled decision', () => {
    render(
      <PlanApproval
        plan={plan}
        onApprove={() => {}}
        approveOptions={[{ value: 'manual', label: 'Manually approve edits' }]}
        decision={{ kind: 'approved', mode: 'manual' }}
      />
    );
    expect(screen.getByText('Approved · Manually approve edits')).toBeInTheDocument();
  });
});
