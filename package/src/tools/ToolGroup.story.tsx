import React from 'react';
import { expect, userEvent, waitFor, within } from '@storybook/test';
import { Stack } from '@mantine/core';
import { ToolGroup } from './ToolGroup';
import { NESTED_TOOLS } from './_stories-shared';

export default { title: 'tools/ToolGroup' };

export function Usage() {
  return (
    <Stack p={40} maw={420} gap={24}>
      <ToolGroup
        part={{
          type: 'tool-Task',
          toolCallId: 'task-1',
          state: 'input-available',
          input: { description: 'Explore the codebase for ToolRowBase usages' },
          startedAt: Date.now() - 12_000,
        }}
        nestedTools={NESTED_TOOLS}
        chatStatus="streaming"
        completeLabel="Task completed"
        shimmerLabel="Running task"
        interruptedLabel="Task interrupted"
      />
      <ToolGroup
        part={{
          type: 'tool-Agent',
          toolCallId: 'task-2',
          state: 'output-available',
          input: { description: 'Explore the codebase' },
          output: { totalDurationMs: 42_000 },
        }}
        nestedTools={NESTED_TOOLS}
        chatStatus="ready"
        completeLabel="Agent completed"
        shimmerLabel="Running agent"
        interruptedLabel="Agent interrupted"
      />
      <ToolGroup
        part={{
          type: 'tool-Task',
          toolCallId: 'task-3',
          state: 'input-available',
          input: { description: 'Interrupted work' },
        }}
        nestedTools={NESTED_TOOLS.slice(0, 2)}
        chatStatus="ready"
        completeLabel="Task completed"
        shimmerLabel="Running task"
        interruptedLabel="Task interrupted"
      />
      <ToolGroup
        part={{
          type: 'tool-Task',
          toolCallId: 'task-4',
          state: 'output-error',
          input: { description: 'Failed task' },
          errorText: 'boom',
        }}
        nestedTools={[]}
        chatStatus="ready"
        completeLabel="Task completed"
        interruptedLabel="Task interrupted"
      />
    </Stack>
  );
}

export function Streaming() {
  const [isStreaming, setIsStreaming] = React.useState(false);
  const [runId, setRunId] = React.useState(0);

  const runStream = () => {
    setRunId((prev) => prev + 1);
    setIsStreaming(true);
    window.setTimeout(() => setIsStreaming(false), NESTED_TOOLS.length * 450 + 800);
  };

  React.useEffect(() => {
    runStream();
  }, []);

  const part = isStreaming
    ? {
        type: 'tool-Task',
        toolCallId: `task-stream-${runId}`,
        state: 'input-streaming',
        input: { description: 'Explore the codebase' },
      }
    : {
        type: 'tool-Task',
        toolCallId: `task-stream-${runId}`,
        state: 'output-available',
        input: { description: 'Explore the codebase' },
        output: { totalDurationMs: 6200 },
      };

  return (
    <Stack p={40} maw={420} gap={24}>
      <ToolGroup
        part={part}
        nestedTools={NESTED_TOOLS}
        chatStatus={isStreaming ? 'streaming' : 'ready'}
        completeLabel="Explored"
        shimmerLabel="Exploring"
        interruptedLabel="Exploration interrupted"
        showElapsed={false}
      />
      <button type="button" onClick={runStream} disabled={isStreaming}>
        Replay
      </button>
    </Stack>
  );
}

export const ExpandFlow = {
  render: () => (
    <Stack p={40} maw={420}>
      <ToolGroup
        part={{
          type: 'tool-Agent',
          toolCallId: 'expand-flow',
          state: 'output-available',
          input: { description: 'Explore the codebase' },
          output: { totalDurationMs: 42_000 },
        }}
        nestedTools={NESTED_TOOLS}
        chatStatus="ready"
        completeLabel="Agent completed"
        shimmerLabel="Running agent"
        interruptedLabel="Agent interrupted"
      />
    </Stack>
  ),
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { expanded: false });
    await expect(trigger).toHaveTextContent('Agent completed');
    await userEvent.click(trigger);
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await waitFor(() => expect(canvas.getByText(/index\.ts/)).toBeVisible(), { timeout: 3000 });
    await userEvent.click(trigger);
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  },
};
