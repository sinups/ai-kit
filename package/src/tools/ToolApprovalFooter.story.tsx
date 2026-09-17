import React from 'react';
import { expect, fn, userEvent, within } from '@storybook/test';
import { Box, Paper, Stack, Text } from '@mantine/core';
import { NARROW_WIDTH, WIDE_WIDTH, WidthFrame } from '../_stories/WidthFrame';
import { ToolApprovalFooter } from './ToolApprovalFooter';

export default { title: 'tools/ToolApprovalFooter' };

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <Paper withBorder radius="var(--ae-tool-radius)" style={{ overflow: 'hidden' }}>
      <Text size="xs" c="dimmed" p={10}>
        Card body
      </Text>
      {children}
    </Paper>
  );
}

function Demo() {
  return (
    <Stack gap={16}>
      <Frame>
        <ToolApprovalFooter onApprove={() => console.log('approve')} />
      </Frame>
      <Frame>
        <ToolApprovalFooter
          isPending
          approveLabel="Run"
          rejectLabel="Cancel"
          reason="Approve to start the command"
        />
      </Frame>
      <Frame>
        <ToolApprovalFooter
          approveLabel="Allow"
          rejectLabel="Deny"
          reason="Runs a shell command: yarn test --coverage --runInBand"
          approveOptions={[
            { value: 'once', label: 'Allow once' },
            { value: 'session', label: 'Allow for this session' },
            { value: 'always', label: 'Always allow', description: 'Saved to project settings' },
          ]}
          onApprove={(scope) => console.log('approve', scope)}
          onRejectWithFeedback={(feedback) => console.log('feedback', feedback)}
        />
      </Frame>
    </Stack>
  );
}

function MainFrame({ children }: { children: React.ReactNode }) {
  return (
    <Box
      style={{
        border: '1px solid var(--ae-border)',
        borderRadius: 'var(--ae-tool-radius)',
        overflow: 'hidden',
      }}
    >
      <Box p={10} fz={12} c="var(--ae-fg-muted)">
        Card body
      </Box>
      {children}
    </Box>
  );
}

export function Usage() {
  return (
    <Stack p={40} maw={420} gap={16}>
      <MainFrame>
        <ToolApprovalFooter onApprove={() => console.log('approve')} />
      </MainFrame>
      <MainFrame>
        <ToolApprovalFooter isPending approveLabel="Run" rejectLabel="Cancel" />
      </MainFrame>
    </Stack>
  );
}

export const ApproveForSessionFlow = {
  args: { onApprove: fn() },
  render: ({ onApprove }: { onApprove: (scope?: string) => void }) => (
    <Stack p={40} maw={420}>
      <Frame>
        <ToolApprovalFooter
          approveLabel="Allow"
          rejectLabel="Deny"
          reason="Runs a shell command: yarn test"
          approveOptions={[
            { value: 'once', label: 'Allow once' },
            { value: 'session', label: 'Allow for this session' },
          ]}
          onApprove={onApprove}
        />
      </Frame>
    </Stack>
  ),
  play: async ({
    canvasElement,
    args,
  }: {
    canvasElement: HTMLElement;
    args: { onApprove: (scope?: string) => void };
  }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'More approval options' }));
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(await page.findByRole('menuitem', { name: 'Allow for this session' }));
    await expect(args.onApprove).toHaveBeenCalledWith('session');
  },
};

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

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function ExplainDemo() {
  return (
    <Stack gap={16}>
      <Frame>
        <ToolApprovalFooter
          approveLabel="Run"
          rejectLabel="Skip"
          reason="Runs a shell command: rm -rf dist && yarn build"
          onApprove={() => {}}
          onExplain={async () => {
            await wait(900);
            return {
              risk: 'high',
              explanation: 'Deletes the dist folder recursively, then rebuilds the project.',
              reasoning:
                'rm -rf removes files without confirmation. The path is relative to the project root, so only build output is affected, but a wrong working directory would delete other files.',
            };
          }}
        />
      </Frame>
      <Frame>
        <ToolApprovalFooter
          reason="Reads src/auth/session.ts"
          onApprove={() => {}}
          onExplain={async () => {
            await wait(600);
            return { risk: 'low', explanation: 'Only reads a source file inside the project.' };
          }}
        />
      </Frame>
      <Frame>
        <ToolApprovalFooter
          reason="Fetches https://registry.npmjs.org"
          onApprove={() => {}}
          onExplain={async () => {
            await wait(600);
            throw new Error('The safety model is unavailable');
          }}
        />
      </Frame>
    </Stack>
  );
}

function RuleDemo() {
  const [rule, setRule] = React.useState('Bash(npm run test:*)');
  return (
    <Stack gap={10}>
      <Frame>
        <ToolApprovalFooter
          approveLabel="Run"
          reason="Runs npm run test -- src/auth"
          matchedRule="no allow rule matches Bash(npm run test -- src/auth)"
          approveOptions={[
            { value: 'once', label: 'Allow once' },
            { value: 'session', label: 'Allow for this session' },
          ]}
          ruleSuggestion={{ value: rule, onChange: setRule, label: 'Always allow…' }}
          onApprove={(scope) => console.log('approve', scope, rule)}
          onRejectWithFeedback={() => {}}
        />
      </Frame>
      <Text size="xs" c="dimmed">
        Rule: {rule}
      </Text>
    </Stack>
  );
}

function RequestedByDemo() {
  return (
    <Stack gap={16}>
      <Frame>
        <ToolApprovalFooter
          approveLabel="Allow"
          reason="Edits package.json"
          matchedRule="Edit(package.json) is set to ask"
          requestedBy={{ name: 'test-runner', color: 'teal' }}
          onApprove={() => {}}
        />
      </Frame>
      <Frame>
        <ToolApprovalFooter
          approveLabel="Allow"
          reason="Creates an issue in the tracker"
          requestedBy={{ name: 'release-helper-with-a-long-name', color: 'violet' }}
          onApprove={() => {}}
          onExplain={async () => ({
            risk: 'medium',
            explanation: 'Writes to a shared repository visible to the team.',
          })}
        />
      </Frame>
    </Stack>
  );
}

export function WithExplain() {
  return (
    <Stack gap={32}>
      <WidthFrame width={NARROW_WIDTH}>
        <ExplainDemo />
      </WidthFrame>
      <WidthFrame width={WIDE_WIDTH}>
        <ExplainDemo />
      </WidthFrame>
    </Stack>
  );
}

export function AlwaysAllowRule() {
  return (
    <Stack gap={32}>
      <WidthFrame width={NARROW_WIDTH}>
        <RuleDemo />
      </WidthFrame>
      <WidthFrame width={WIDE_WIDTH}>
        <RuleDemo />
      </WidthFrame>
    </Stack>
  );
}

export function RequestedBy() {
  return (
    <Stack gap={32}>
      <WidthFrame width={NARROW_WIDTH}>
        <RequestedByDemo />
      </WidthFrame>
      <WidthFrame width={WIDE_WIDTH}>
        <RequestedByDemo />
      </WidthFrame>
    </Stack>
  );
}
