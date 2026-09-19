import React, { useEffect, useRef, useState } from 'react';
import { expect, userEvent, waitFor, within } from '@storybook/test';
import { Box, Button, Paper, Stack } from '@mantine/core';
import type { ChatMessage, ChatStatus, MessagePart, SendScroll } from '../types';
import { NARROW_WIDTH, WIDE_WIDTH } from '../_stories/WidthFrame';
import { MessageList } from './MessageList';

export default { title: 'Chat/MessageList/Streaming' };

const TICK_MS = 40;
const SUBMITTED_MS = 240;
const TOOL = 'tool-mcp__docs__search_docs';
const TOOL_INPUT = { query: 'token refresh retry', limit: 5 };

const INTRO = 'Let me check how the client refreshes the token.';
const ANSWER = `The refresh fails because the retry reuses the request that already carried the expired token.

When the first call returns **401**, the client refreshes the token and replays the original request object. The headers of that object were built before the refresh, so the replay sends the old token again and the server answers 401 a second time.

What to change:

- Build the headers when the request is sent, not when it is created, so a replay reads the current token.
- Let only one refresh run at a time and make the other requests wait for it instead of starting their own.
- Give up after one replay: a second 401 means the refresh token itself is no longer valid, and the user has to sign in again.

\`\`\`ts
const send = async (request: Request) =>
  fetch(request.url, { ...request, headers: await authHeaders() });
\`\`\`

With the headers built at send time the replay picks up the new token, and the two extra 401 responses in the log disappear.`;

function words(text: string): string[] {
  return text.match(/\S+\s*/g) ?? [];
}

function prefixes(text: string): string[] {
  const all = words(text);
  return all.map((_, index) => all.slice(0, index + 1).join(''));
}

function chunks(text: string, size: number): string[] {
  return Array.from({ length: Math.ceil(text.length / size) }, (_, index) =>
    text.slice(0, (index + 1) * size)
  );
}

type ToolState = {
  state: 'input-streaming' | 'input-available' | 'output-available';
  input: unknown;
};

function toolPart({ state, input }: ToolState): MessagePart {
  return {
    type: TOOL,
    toolCallId: 'search-1',
    state,
    input,
    ...(state === 'output-available'
      ? {
          output: {
            content: [
              { type: 'text', text: 'auth/refresh.md — Replaying requests after a refresh' },
            ],
          },
        }
      : {}),
  } as MessagePart;
}

/**
 * Snapshots of the assistant parts as an SSE stream delivers them: the intro word by word, the call
 * with its input growing as `tool_call_partial` chunks, then the answer streaming while the call
 * still runs, and the result arriving in the middle of it.
 */
function buildFrames(): MessagePart[][] {
  const frames: MessagePart[][] = [];
  const intro = prefixes(INTRO);
  for (const text of intro) {
    frames.push([{ type: 'text', text }]);
  }
  const introPart: MessagePart = { type: 'text', text: INTRO };
  for (const input of chunks(JSON.stringify(TOOL_INPUT), 6)) {
    frames.push([introPart, toolPart({ state: 'input-streaming', input })]);
  }
  const answer = prefixes(ANSWER);
  const resultAt = 20;
  answer.forEach((text, index) => {
    const state = index < resultAt ? 'input-available' : 'output-available';
    frames.push([introPart, toolPart({ state, input: TOOL_INPUT }), { type: 'text', text }]);
  });
  return frames;
}

const FRAMES = buildFrames();

const HISTORY: ChatMessage[] = Array.from({ length: 3 }, (_, index) => [
  {
    id: `hu${index}`,
    role: 'user' as const,
    parts: [{ type: 'text', text: `Question ${index + 1}` }],
  },
  {
    id: `ha${index}`,
    role: 'assistant' as const,
    parts: [{ type: 'text', text: `Answer ${index + 1}: a short reply that fills a line or two.` }],
  },
]).flat();

const PROMPT: ChatMessage = {
  id: 'ask',
  role: 'user',
  parts: [{ type: 'text', text: 'Why does the token refresh fail after a retry?' }],
};

function SseDemo({ width, sendScroll }: { width: number; sendScroll: SendScroll }) {
  const [frame, setFrame] = useState<number | null>(null);
  const [sent, setSent] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const send = () => {
    setSent(true);
    setFrame(null);
    const next = (index: number) => {
      setFrame(index);
      if (index < FRAMES.length - 1) {
        timer.current = setTimeout(() => next(index + 1), TICK_MS);
      }
    };
    timer.current = setTimeout(() => next(0), SUBMITTED_MS);
  };

  const done = frame === FRAMES.length - 1;
  const status: ChatStatus = !sent || done ? 'ready' : frame === null ? 'submitted' : 'streaming';
  const messages: ChatMessage[] = [
    ...HISTORY,
    ...(sent ? [PROMPT] : []),
    ...(frame !== null ? [{ id: 'answer', role: 'assistant' as const, parts: FRAMES[frame] }] : []),
  ];

  return (
    <Stack p="xl" gap="xs" data-stream-done={done || undefined}>
      <Button size="xs" w="fit-content" disabled={sent && !done} onClick={send}>
        Send
      </Button>
      <Box w={width} maw="100%">
        <Paper withBorder radius={0} h={420} display="flex" style={{ flexDirection: 'column' }}>
          <MessageList
            messages={messages}
            status={status}
            sendScroll={sendScroll}
            frameBatched
            streamingCaret
            workingRow
          />
        </Paper>
      </Box>
    </Stack>
  );
}

type Canvas = { canvasElement: HTMLElement };

// The stream runs for several seconds; the snapshot waits for its end and checks the question never moved.
async function playStream({ canvasElement }: Canvas) {
  const canvas = within(canvasElement);
  await userEvent.click(canvas.getByRole('button', { name: 'Send' }));
  const scroller = canvasElement.querySelector<HTMLElement>('[role="log"]')!;
  const turn = await waitFor(() => {
    const element = scroller.querySelector<HTMLElement>('[data-turn-key="ask"]');
    if (!element) {
      throw new Error('The sent turn is not rendered yet');
    }
    return element;
  });
  const offset = () => turn.getBoundingClientRect().top - scroller.getBoundingClientRect().top;
  await waitFor(() => expect(Math.abs(offset())).toBeLessThan(8));
  await waitFor(() => expect(canvasElement.querySelector('[data-stream-done]')).not.toBeNull(), {
    timeout: 20000,
  });
  await expect(Math.abs(offset())).toBeLessThan(8);
  await expect(await canvas.findByRole('button', { name: /new message/ })).toBeVisible();
}

type Args = { sendScroll?: SendScroll };

export const SseNarrow = {
  render: ({ sendScroll = 'prompt-top-hold' }: Args) => (
    <SseDemo width={NARROW_WIDTH} sendScroll={sendScroll} />
  ),
  play: playStream,
};

export const SseWide = {
  render: ({ sendScroll = 'prompt-top-hold' }: Args) => (
    <SseDemo width={WIDE_WIDTH} sendScroll={sendScroll} />
  ),
  play: playStream,
};
