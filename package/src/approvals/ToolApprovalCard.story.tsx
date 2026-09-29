import React, { useState } from 'react';
import { Badge, Box, Stack, Text } from '@mantine/core';
import { IconBriefcase, IconDatabase } from '@tabler/icons-react';
import { expect, userEvent, within } from '@storybook/test';
import { ToolApprovalCard, type ToolApprovalCardDecision } from './ToolApprovalCard';

export default { title: 'Approvals/ToolApprovalCard' };

const CALL = {
  tool: { name: 'Find jobs' },
  server: { name: 'Jobs board', icon: <IconBriefcase size={14} /> },
  params: {
    action: 'smart_search',
    org_uid: '1106955086989844481',
    params: { limit: 10, mode: 'best_match' },
  },
};

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <Box maw={720} p="xl">
      {children}
    </Box>
  );
}

export function Usage() {
  const [decision, setDecision] = useState<ToolApprovalCardDecision | null>(null);
  return (
    <Frame>
      <Stack gap="sm" align="flex-start">
        <ToolApprovalCard
          {...CALL}
          onDecline={() => setDecision('declined')}
          onAllowOnce={() => setDecision('once')}
          onAlwaysAllow={() => setDecision('always')}
        />
        <Text size="xs" c="dimmed">
          Answer: {decision ?? 'waiting'}
        </Text>
      </Stack>
    </Frame>
  );
}

export function Folded() {
  return (
    <Frame>
      <ToolApprovalCard
        {...CALL}
        defaultExpanded={false}
        onDecline={() => {}}
        onAllowOnce={() => {}}
        onAlwaysAllow={() => {}}
      />
    </Frame>
  );
}

export function WithoutServer() {
  return (
    <Frame>
      <ToolApprovalCard
        tool={{ name: 'Run query', icon: <IconDatabase size={14} /> }}
        params={{
          statement: 'select count(*) from orders where created_at > now() - 7',
          rows: 500,
        }}
        labels={{ agent: 'Aria', sentenceWithoutServer: '{agent} wants to use {tool}' }}
        onDecline={() => {}}
        onAllowOnce={() => {}}
      >
        <Text size="xs" c="dimmed" mt="xs">
          Asked because: the rule allows reads only up to 100 rows
        </Text>
      </ToolApprovalCard>
    </Frame>
  );
}

export function Decided() {
  return (
    <Frame>
      <Stack gap="md">
        <ToolApprovalCard
          {...CALL}
          decision="once"
          onDecline={() => {}}
          onAllowOnce={() => {}}
          onAlwaysAllow={() => {}}
        />
        <ToolApprovalCard
          {...CALL}
          decision="declined"
          defaultExpanded={false}
          onDecline={() => {}}
          onAllowOnce={() => {}}
          onAlwaysAllow={() => {}}
        />
      </Stack>
    </Frame>
  );
}

export function Localized() {
  return (
    <Frame>
      <ToolApprovalCard
        tool={{ name: 'Найти задачи' }}
        server={{ name: 'Трекер', icon: <Badge size="xs" variant="light" circle p={0} /> }}
        params={{ проект: 'Layers', лимит: 25 }}
        labels={{
          agent: 'Агент',
          sentence: '{agent} хочет вызвать {tool} из {server}',
          decline: 'Отклонить',
          allowOnce: 'Разрешить один раз',
          alwaysAllow: 'Разрешать всегда',
          params: 'Аргументы вызова',
        }}
        onDecline={() => {}}
        onAllowOnce={() => {}}
        onAlwaysAllow={() => {}}
      />
    </Frame>
  );
}

export const AnswerFlow = {
  parameters: { visual: { skip: true } },
  render: () => <Usage />,
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: /Allow once/ }));
    await expect(canvas.getByText('Answer: once')).toBeInTheDocument();
  },
};
