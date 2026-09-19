import React, { useEffect, useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from '@storybook/test';
import { Stack } from '@mantine/core';
import { BashTool } from './BashTool';
import type { ToolApprovalExplanation } from './ToolApprovalFooter';
import { bashPart } from './_story-helpers';

export default { title: 'Tools/BashTool' };

export function Usage() {
  return (
    <Stack p={40} maw={420} gap={16}>
      <BashTool part={bashPart('input-streaming')} />
      <BashTool part={bashPart('input-available')} />
      <BashTool
        part={bashPart('output-available', {
          output: { stdout: 'src/index.ts(12,5): error TS2322\nFound 1 error.', exitCode: 1 },
        })}
      />
      <BashTool
        part={bashPart('output-available', {
          output: { stdout: 'Done in 3.2s.', exitCode: 0 },
        })}
      />
      <BashTool
        part={bashPart('output-error', {
          errorText: 'Command failed',
        })}
      />
    </Stack>
  );
}

export function WithApproval() {
  return (
    <Stack p={40} maw={420} gap={16}>
      <BashTool
        part={bashPart('input-available', {
          input: {
            command: 'rm -rf dist && yarn build',
            approval: {
              onApprove: () => console.log('approve'),
              onReject: () => console.log('reject'),
            },
          },
        })}
      />
      <BashTool
        part={bashPart('output-available', {
          input: {
            command: 'yarn build',
            approval: { labels: { approve: 'Run', reject: 'Cancel' } },
          },
          output: { stdout: 'Built in 2.1s', exitCode: 0 },
        })}
      />
    </Stack>
  );
}

const BUILD_STEPS = [
  'vite v6.2.0 building for production...',
  '\x1b[32m✓\x1b[39m 412 modules transformed.',
  'rendering chunks...',
  'computing gzip size...',
  '\x1b[2mdist/\x1b[22m\x1b[36massets/index-4f2a.js\x1b[39m   \x1b[1m182.40 kB\x1b[22m │ gzip: 58.12 kB',
  '\x1b[2mdist/\x1b[22m\x1b[35massets/index-9c1d.css\x1b[39m   \x1b[1m21.03 kB\x1b[22m │ gzip: 4.81 kB',
  '\x1b[33m(!) Some chunks are larger than 500 kB after minification.\x1b[39m',
  'See https://vitejs.dev/guide/build for details.',
];

function StreamingDemo() {
  const [count, setCount] = useState(1);
  const done = count > BUILD_STEPS.length + 2;
  useEffect(() => {
    const id = window.setInterval(
      () => setCount((value) => (value > BUILD_STEPS.length + 6 ? 1 : value + 1)),
      700
    );
    return () => window.clearInterval(id);
  }, []);
  const tail = BUILD_STEPS.slice(0, Math.min(count, BUILD_STEPS.length)).join('\n');
  return (
    <BashTool
      part={bashPart(done ? 'output-available' : 'input-available', {
        input: { command: 'yarn vite build --mode production', timeout: 120000 },
        callProviderMetadata: { custom: { startedAt: Date.now() - count * 700 } },
        output: done ? { stdout: tail, exitCode: 0, durationMs: 6100 } : { outputTail: tail },
      })}
      withOutputMeta
      formatOutput
    />
  );
}

export function Streaming() {
  return (
    <Stack p={40} maw={420} gap={16}>
      <StreamingDemo />
      <BashTool
        part={bashPart('output-available', {
          input: { command: 'yarn test --coverage' },
          output: {
            stdout: Array.from(
              { length: 40 },
              (_, index) => `\x1b[32m✓\x1b[39m test ${index + 1}`
            ).join('\n'),
            stderr: '\x1b[31m✕ invoice › totals\x1b[39m',
            exitCode: 1,
            durationMs: 12400,
          },
        })}
        withOutputMeta
        formatOutput
      />
    </Stack>
  );
}

type ApprovalArgs = {
  onApprove: (scope?: string) => void;
  onReject: () => void;
  onRejectWithFeedback: (feedback: string) => void;
  onExplain: () => Promise<ToolApprovalExplanation>;
  onRuleChange: (rule: string) => void;
};

type FlowContext<A> = { canvasElement: HTMLElement; args: A };

const approvalArgs = (): ApprovalArgs => ({
  onApprove: fn(),
  onReject: fn(),
  onRejectWithFeedback: fn(),
  onExplain: fn(async () => ({
    risk: 'medium' as const,
    explanation: 'Runs the test suite and writes a coverage report to coverage/',
    reasoning: 'The command only reads sources and writes into the ignored coverage folder.',
  })),
  onRuleChange: fn(),
});

function ApprovalCard(args: ApprovalArgs) {
  return (
    <Stack p={40} maw={420}>
      <BashTool
        part={bashPart('input-available', {
          toolCallId: 'approval-flow',
          input: {
            command: 'yarn test --coverage',
            approval: {
              labels: { approve: 'Run', reject: 'Skip' },
              reason: 'Runs a shell command',
              approveOptions: [
                { value: 'once', label: 'Allow once' },
                { value: 'session', label: 'Allow for this session' },
              ],
              ruleSuggestion: { value: 'Bash(yarn test:*)', onChange: args.onRuleChange },
              onApprove: args.onApprove,
              onReject: args.onReject,
              onRejectWithFeedback: args.onRejectWithFeedback,
              onExplain: args.onExplain,
            },
          },
        })}
      />
    </Stack>
  );
}

export const ApproveFlow = {
  args: approvalArgs(),
  render: (args: ApprovalArgs) => <ApprovalCard {...args} />,
  play: async ({ canvasElement, args }: FlowContext<ApprovalArgs>) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Run' }));
    await expect(args.onApprove).toHaveBeenCalledWith();
    await expect(canvas.getByRole('button', { name: 'Approved' })).toBeDisabled();
    await expect(args.onReject).not.toHaveBeenCalled();
  },
};

export const RejectFlow = {
  args: approvalArgs(),
  render: (args: ApprovalArgs) => <ApprovalCard {...args} />,
  play: async ({ canvasElement, args }: FlowContext<ApprovalArgs>) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Skip' }));
    await expect(args.onReject).toHaveBeenCalledTimes(1);
    await expect(canvas.getByRole('button', { name: 'Skipped' })).toBeDisabled();
    await expect(canvas.getByText(/Canceled/)).toBeInTheDocument();
  },
};

export const ApproveScopeFlow = {
  args: approvalArgs(),
  render: (args: ApprovalArgs) => <ApprovalCard {...args} />,
  play: async ({ canvasElement, args }: FlowContext<ApprovalArgs>) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole('button', { name: 'More approval options' }));
    await userEvent.click(await page.findByRole('menuitem', { name: 'Allow for this session' }));
    await expect(args.onApprove).toHaveBeenCalledWith('session');
  },
};

export const RejectWithFeedbackFlow = {
  args: approvalArgs(),
  render: (args: ApprovalArgs) => <ApprovalCard {...args} />,
  play: async ({ canvasElement, args }: FlowContext<ApprovalArgs>) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole('button', { name: 'More approval options' }));
    await userEvent.click(await page.findByRole('menuitem', { name: 'Reject with feedback' }));
    const input = await canvas.findByPlaceholderText('Tell the agent what to do instead');
    await userEvent.type(input, 'Run only the billing tests{Enter}');
    await expect(args.onRejectWithFeedback).toHaveBeenCalledWith('Run only the billing tests');
    await expect(args.onReject).not.toHaveBeenCalled();
  },
};

export const ExplainFlow = {
  args: approvalArgs(),
  render: (args: ApprovalArgs) => <ApprovalCard {...args} />,
  play: async ({ canvasElement, args }: FlowContext<ApprovalArgs>) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Why?' }));
    await expect(args.onExplain).toHaveBeenCalledTimes(1);
    const explanation = await canvas.findByText(
      'Runs the test suite and writes a coverage report to coverage/'
    );
    await waitFor(() => expect(explanation).toBeVisible(), { timeout: 3000 });
    await userEvent.click(canvas.getByRole('button', { name: 'Show reasoning' }));
    await expect(canvas.getByRole('button', { name: 'Hide reasoning' })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
    await expect(canvas.getByText(/only reads sources/)).toBeInTheDocument();
  },
};

export const AlwaysAllowRuleFlow = {
  args: approvalArgs(),
  render: (args: ApprovalArgs) => <ApprovalCard {...args} />,
  play: async ({ canvasElement, args }: FlowContext<ApprovalArgs>) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole('button', { name: 'More approval options' }));
    await userEvent.click(await page.findByRole('menuitem', { name: 'Always allow' }));
    const rule = await canvas.findByRole('textbox', { name: 'Permission rule' });
    await expect(rule).toHaveValue('Bash(yarn test:*)');
    await userEvent.clear(rule);
    await userEvent.type(rule, 'Bash(yarn test src/billing:*)');
    await expect(args.onRuleChange).toHaveBeenLastCalledWith('Bash(yarn test src/billing:*)');
    await userEvent.click(canvas.getByRole('button', { name: 'Confirm' }));
    await expect(args.onApprove).toHaveBeenCalledWith('always');
  },
};

type OutputArgs = Record<string, never>;

export const StreamingOutputFlow = {
  render: () => (
    <Stack p={40} maw={420}>
      <BashTool
        part={bashPart('output-available', {
          toolCallId: 'output-flow',
          input: { command: 'yarn test' },
          output: {
            stdout: Array.from(
              { length: 30 },
              (_, index) => `\x1b[32m✓\x1b[39m test ${index + 1}`
            ).join('\n'),
            exitCode: 0,
            durationMs: 3200,
          },
        })}
        withOutputMeta
        formatOutput
      />
    </Stack>
  ),
  play: async ({ canvasElement }: FlowContext<OutputArgs>) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('exit 0')).toBeInTheDocument();
    await expect(canvas.getByText('+22 more lines')).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: 'Show all 30 lines' }));
    await expect(canvas.getByText('test 1')).toBeInTheDocument();
  },
};
