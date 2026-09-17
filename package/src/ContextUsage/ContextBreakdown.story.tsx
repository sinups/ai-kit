import React from 'react';
import { expect, fn, userEvent, within } from '@storybook/test';
import { Group, Paper, Stack } from '@mantine/core';
import { NARROW_WIDTH, WIDE_WIDTH, WidthFrame } from '../_stories/WidthFrame';
import { InputBar } from '../input/InputBar';
import { ContextBreakdown } from './ContextBreakdown';
import { ContextUsage } from './ContextUsage';
import { CONTEXT_GROUPS, CONTEXT_SUGGESTIONS } from './fixtures';

export default { title: 'ContextUsage/ContextBreakdown' };

function Page() {
  return (
    <Paper withBorder radius="md" p="md">
      <ContextBreakdown
        groups={CONTEXT_GROUPS}
        total={200_000}
        suggestions={CONTEXT_SUGGESTIONS}
        defaultExpanded={['mcpTools']}
      />
    </Paper>
  );
}

export function Usage() {
  return (
    <Stack p="xl" maw={640}>
      <Page />
    </Stack>
  );
}

export function Narrow() {
  return (
    <WidthFrame width={NARROW_WIDTH}>
      <Page />
    </WidthFrame>
  );
}

export function Wide() {
  return (
    <WidthFrame width={WIDE_WIDTH}>
      <Page />
    </WidthFrame>
  );
}

export function Compact() {
  return (
    <WidthFrame width={340}>
      <Paper withBorder radius="md" p="sm">
        <ContextBreakdown
          variant="compact"
          groups={CONTEXT_GROUPS}
          total={200_000}
          suggestions={CONTEXT_SUGGESTIONS}
        />
      </Paper>
    </WidthFrame>
  );
}

export function WithoutSuggestions() {
  return (
    <WidthFrame width={NARROW_WIDTH}>
      <Paper withBorder radius="md" p="md">
        <ContextBreakdown groups={CONTEXT_GROUPS.slice(0, 3)} total={200_000} used={34_000} />
      </Paper>
    </WidthFrame>
  );
}

export function InContextUsagePopover() {
  return (
    <Stack p={80} gap="xl">
      <Group gap="xl">
        <ContextUsage
          used={139_750}
          total={200_000}
          breakdown={CONTEXT_GROUPS}
          suggestions={CONTEXT_SUGGESTIONS}
          withLabel
        />
        <ContextUsage
          used={176_000}
          total={200_000}
          breakdown={CONTEXT_GROUPS}
          suggestions={CONTEXT_SUGGESTIONS}
          withLabel
          onCompact={() => {}}
        />
      </Group>
      <WidthFrame width={WIDE_WIDTH}>
        <InputBar
          status="ready"
          onSend={() => {}}
          onStop={() => {}}
          contentWidth="100%"
          rightActions={
            <ContextUsage
              used={139_750}
              total={200_000}
              breakdown={CONTEXT_GROUPS}
              suggestions={CONTEXT_SUGGESTIONS}
            />
          }
        />
      </WidthFrame>
    </Stack>
  );
}

export const ExpandFlow = {
  args: { onReview: fn() },
  render: ({ onReview }: { onReview: () => void }) => (
    <Stack p="xl" maw={520}>
      <ContextBreakdown
        groups={CONTEXT_GROUPS}
        total={200_000}
        suggestions={CONTEXT_SUGGESTIONS.map((suggestion) =>
          suggestion.action?.label === 'Review servers'
            ? { ...suggestion, action: { label: 'Review servers', onClick: onReview } }
            : suggestion
        )}
      />
    </Stack>
  ),
  play: async ({
    canvasElement,
    args,
  }: {
    canvasElement: HTMLElement;
    args: { onReview: () => void };
  }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('140k / 200k tokens · 70%')).toBeInTheDocument();
    const mcp = canvas.getByRole('button', { name: /MCP tools/ });
    await userEvent.click(mcp);
    await expect(mcp).toHaveAttribute('aria-expanded', 'true');
    await expect(await canvas.findByText('git')).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: 'Review servers' }));
    await expect(args.onReview).toHaveBeenCalledTimes(1);
  },
};

export const InUsagePopoverFlow = {
  render: () => (
    <Group p="xl">
      <ContextUsage
        used={139_800}
        total={200_000}
        breakdown={CONTEXT_GROUPS}
        suggestions={CONTEXT_SUGGESTIONS}
        withLabel
      />
    </Group>
  ),
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: /Context usage/ }));
    const page = within(canvasElement.ownerDocument.body);
    await expect(await page.findByText('140k / 200k tokens · 70%')).toBeInTheDocument();
    await expect(page.getByRole('button', { name: /Memory files/ })).toBeInTheDocument();
    await expect(page.getByText('Disable 3 unused MCP servers')).toBeInTheDocument();
  },
};
