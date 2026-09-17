import React from 'react';
import { Stack } from '@mantine/core';
import { expect, fn, userEvent, waitFor, within } from '@storybook/test';
import { NARROW_WIDTH, WIDE_WIDTH, WidthFrame } from '../../_stories/WidthFrame';
import type { Plan } from '../../tools/PlanTool';
import { wait } from '../_story-helpers';
import { PlanApproval } from './PlanApproval';

export default { title: 'message-actions/PlanApproval' };

const PLAN: Plan = {
  id: 'auth-refresh',
  title: 'Add retry to token refresh',
  summary: `## Goal
Refresh failures should retry with backoff instead of logging the user out.

## Steps
1. Extract \`refreshToken\` from \`src/auth/session.ts\` into \`src/auth/refresh.ts\`
2. Wrap the request in \`withRetry\` (3 attempts, exponential backoff, jitter)
3. Treat \`401\` as final, retry only network errors and \`5xx\`
4. Emit \`auth:refresh-failed\` after the last attempt
5. Add unit tests for success, retry and final failure

## Risks
- Parallel requests may trigger several refreshes; guard with a shared promise
- Backoff must stay under the 10s request timeout`,
};

function Demo({ fail = false }: { fail?: boolean }) {
  const act = async () => {
    await wait(800);
    if (fail) {
      throw new Error('The session has ended, start a new one to continue');
    }
  };
  return <PlanApproval plan={PLAN} onApprove={act} onApproveWithEdits={act} onReject={act} />;
}

export function Usage() {
  return (
    <Stack p="xl" maw={560}>
      <Demo />
    </Stack>
  );
}

export function Narrow() {
  return (
    <WidthFrame width={NARROW_WIDTH}>
      <Demo />
    </WidthFrame>
  );
}

export function Wide() {
  return (
    <WidthFrame width={WIDE_WIDTH}>
      <Demo />
    </WidthFrame>
  );
}

export function DecisionError() {
  return (
    <Stack p="xl" maw={560}>
      <Demo fail />
    </Stack>
  );
}

export function Decided() {
  return (
    <Stack p="xl" maw={560} gap="lg">
      <PlanApproval plan={PLAN} onApprove={() => {}} decision={{ kind: 'approved' }} />
      <PlanApproval
        plan={PLAN}
        onApprove={() => {}}
        decision={{ kind: 'approved-with-edits', edits: 'Skip step 4, we have no event bus yet.' }}
      />
      <PlanApproval
        plan={{ title: 'Rewrite the router' }}
        onApprove={() => {}}
        decision={{ kind: 'rejected', feedback: 'Too broad for this PR.' }}
      />
    </Stack>
  );
}

const APPROVE_OPTIONS = [
  {
    value: 'auto-accept',
    label: 'Auto-accept edits',
    description: 'Apply file edits without asking, still ask for commands',
  },
  {
    value: 'manual',
    label: 'Manually approve edits',
    description: 'Ask before every edit',
  },
  {
    value: 'clear-context',
    label: 'Clear context and start',
    description: 'Start fresh with only the plan in context',
  },
];

function OptionsDemo() {
  return (
    <PlanApproval
      plan={PLAN}
      approveOptions={APPROVE_OPTIONS}
      onApprove={() => wait(800)}
      onApproveWithEdits={() => wait(800)}
      onReject={() => wait(800)}
    />
  );
}

export function WithApproveOptions() {
  return (
    <Stack p="xl" maw={560}>
      <OptionsDemo />
    </Stack>
  );
}

export function WithApproveOptionsNarrow() {
  return (
    <WidthFrame width={NARROW_WIDTH}>
      <OptionsDemo />
    </WidthFrame>
  );
}

export function WithApproveOptionsWide() {
  return (
    <WidthFrame width={WIDE_WIDTH}>
      <OptionsDemo />
    </WidthFrame>
  );
}

function renderPlanFlow(args: Record<string, any>) {
  return (
    <Stack p="xl" maw={560}>
      <PlanApproval
        plan={PLAN}
        onApprove={args.onApprove}
        onApproveWithEdits={args.onApproveWithEdits}
        onReject={args.onReject}
      />
    </Stack>
  );
}

export const ApproveFlow = {
  args: { onApprove: fn(), onApproveWithEdits: fn(), onReject: fn() },
  render: renderPlanFlow,
  play: async ({
    canvasElement,
    args,
  }: {
    canvasElement: HTMLElement;
    args: Record<string, any>;
  }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole('button', { name: 'Show full plan' }));
    await expect(canvas.getByRole('button', { name: 'Show less' })).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Approve' }));
    await expect(args.onApprove).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(canvas.getByText('Approved')).toBeVisible());
    await expect(canvas.queryByRole('button', { name: 'Approve' })).toBeNull();
  },
};

export const ApproveWithEditsFlow = {
  args: { onApprove: fn(), onApproveWithEdits: fn(), onReject: fn() },
  render: renderPlanFlow,
  play: async ({
    canvasElement,
    args,
  }: {
    canvasElement: HTMLElement;
    args: Record<string, any>;
  }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Approve with edits' }));
    const submit = canvas.getByRole('button', { name: 'Approve with edits' });
    await expect(submit).toBeDisabled();
    await userEvent.type(canvas.getByLabelText('Edits to the plan'), ' Skip step 5 ');
    await userEvent.click(submit);
    await expect(args.onApproveWithEdits).toHaveBeenCalledWith('Skip step 5');
    await waitFor(() => expect(canvas.getByText('Approved with edits')).toBeVisible());
    await expect(canvas.getByText('Skip step 5')).toBeVisible();
  },
};

export const RejectFlow = {
  args: { onApprove: fn(), onApproveWithEdits: fn(), onReject: fn() },
  render: renderPlanFlow,
  play: async ({
    canvasElement,
    args,
  }: {
    canvasElement: HTMLElement;
    args: Record<string, any>;
  }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Reject with feedback' }));
    await userEvent.type(canvas.getByLabelText('Why is the plan rejected?'), 'Too broad');
    await userEvent.click(canvas.getByRole('button', { name: 'Reject' }));
    await expect(args.onReject).toHaveBeenCalledWith('Too broad');
    await waitFor(() => expect(canvas.getByText('Rejected')).toBeVisible());
    await expect(args.onApprove).not.toHaveBeenCalled();
  },
};

export const DecisionErrorFlow = {
  args: {
    onApprove: fn(),
    onApproveWithEdits: fn(),
    onReject: fn(async () => {
      throw new Error('The session has ended');
    }),
  },
  render: renderPlanFlow,
  play: async ({
    canvasElement,
    args,
  }: {
    canvasElement: HTMLElement;
    args: Record<string, any>;
  }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Reject with feedback' }));
    const input = canvas.getByLabelText('Why is the plan rejected?');
    await userEvent.type(input, 'Not now');
    await userEvent.click(canvas.getByRole('button', { name: 'Reject' }));
    await expect(args.onReject).toHaveBeenCalledWith('Not now');
    await waitFor(() => expect(canvas.getByText('The session has ended')).toBeVisible());
    await expect(input).toHaveValue('Not now');
    await expect(canvas.queryByText('Rejected')).toBeNull();
  },
};
