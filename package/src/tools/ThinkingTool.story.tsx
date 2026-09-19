import React from 'react';
import { expect, waitFor, within } from '@storybook/test';
import { Stack } from '@mantine/core';
import { ThinkingTool } from './ThinkingTool';

export default { title: 'Tools/ThinkingTool' };

const thought = `The user wants the tool cards ported one to one.
First I should check which tokens exist in vars.module.css, then map every Tailwind
utility to a token. Diff rendering needs a custom component since @pierre/diffs is banned.`;

export function Usage() {
  return (
    <Stack p={40} maw={420} gap={16}>
      <ThinkingTool
        part={{
          type: 'tool-Thinking',
          toolCallId: 'th-1',
          state: 'input-available',
          input: { thought },
        }}
      />
      <ThinkingTool
        part={{
          type: 'tool-Thinking',
          toolCallId: 'th-2',
          state: 'output-available',
          input: { thought },
          output: thought,
        }}
        defaultOpen
      />
      <ThinkingTool
        part={{ type: 'tool-Thinking', toolCallId: 'th-3', state: 'output-available', input: {} }}
      />
    </Stack>
  );
}

export function Streaming() {
  const [content, setContent] = React.useState('');
  const [isStreaming, setIsStreaming] = React.useState(false);

  const runStream = () => {
    setContent('');
    setIsStreaming(true);
    let i = 0;
    const tick = () => {
      i += 1;
      setContent(thought.slice(0, i));
      if (i >= thought.length) {
        setIsStreaming(false);
        return;
      }
      window.setTimeout(tick, 16);
    };
    window.setTimeout(tick, 120);
  };

  React.useEffect(() => {
    runStream();
  }, []);

  return (
    <Stack p={40} maw={420} gap={16}>
      <ThinkingTool
        part={{
          type: 'tool-Thinking',
          toolCallId: 'th-stream',
          state: isStreaming ? 'input-streaming' : 'output-available',
          input: { thought: content },
        }}
        defaultOpen
      />
      <button type="button" onClick={runStream} disabled={isStreaming}>
        Replay
      </button>
    </Stack>
  );
}

// The thought streams for a few seconds; the snapshot waits for the finished card.
Streaming.play = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
  const canvas = within(canvasElement);
  await waitFor(
    () => {
      expect(canvas.getAllByText(/is banned\./).length).toBeGreaterThan(0);
      expect(canvas.getByRole('button', { name: 'Replay' })).toBeEnabled();
    },
    { timeout: 10000 }
  );
};
