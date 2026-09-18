import React, { useEffect, useRef, useState } from 'react';
import { expect, userEvent, waitFor, within } from '@storybook/test';
import { Badge, Box, Button, Group, Paper, Stack, Text } from '@mantine/core';
import { IconChartBar, IconPin, IconPinFilled } from '@tabler/icons-react';
import { MessageActionButton } from '../message-actions/MessageActionButton/MessageActionButton';
import type { ChatMessage, PartRendererProps, PartRenderers } from '../types';
import { MessageList } from './MessageList';

export default { title: 'MessageList/Additions' };

type Canvas = { canvasElement: HTMLElement };

function Frame({ children, controls }: { children: React.ReactNode; controls?: React.ReactNode }) {
  return (
    <Stack p="xl" gap="xs" maw={560}>
      {controls}
      <Paper withBorder radius={0} h={520} display="flex" style={{ flexDirection: 'column' }}>
        {children}
      </Paper>
    </Stack>
  );
}

type ChartPart = { type: 'data-chart'; title: string; values: number[] };

function ChartCard({ part }: PartRendererProps<ChartPart>) {
  const max = Math.max(...part.values);
  return (
    <Paper withBorder p="sm" radius="md" data-testid="chart-part">
      <Group gap="xs" mb="xs">
        <IconChartBar size={16} />
        <Text size="sm" fw={500}>
          {part.title}
        </Text>
      </Group>
      <Group gap={4} align="flex-end" h={64}>
        {part.values.map((value, index) => (
          <Box key={index} w="md" h={`${(value / max) * 100}%`} bg="var(--ae-primary)" bdrs="xs" />
        ))}
      </Group>
    </Paper>
  );
}

const PART_RENDERERS: PartRenderers = { 'data-chart': ChartCard };

const CHART_MESSAGES: ChatMessage[] = [
  { id: 'u1', role: 'user', parts: [{ type: 'text', text: 'How did signups go this week?' }] },
  {
    id: 'a1',
    role: 'assistant',
    parts: [
      { type: 'text', text: 'Signups grew every day but Saturday:' },
      { type: 'data-chart', title: 'Signups', values: [12, 18, 21, 25, 30, 14, 33] } as never,
      { type: 'data-internal', note: 'hidden without a renderer' } as never,
    ],
  },
];

export function CustomParts() {
  return (
    <Frame>
      <MessageList messages={CHART_MESSAGES} status="ready" partRenderers={PART_RENDERERS} />
    </Frame>
  );
}

CustomParts.play = async ({ canvasElement }: Canvas) => {
  const canvas = within(canvasElement);
  await expect(await canvas.findByTestId('chart-part')).toBeVisible();
  await expect(canvas.queryByText('hidden without a renderer')).toBeNull();
};

const ANSWER =
  'The refresh token is rotated on every call, so a retry sends a token the server already revoked. Keep the new token from the first response and retry with it. '.repeat(
    4
  );

function useStream(onDone?: () => void) {
  const [text, setText] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  useEffect(() => () => clearInterval(timer.current), []);
  const start = () => {
    let shown = 0;
    setText('');
    clearInterval(timer.current);
    timer.current = setInterval(() => {
      shown += 6;
      setText(ANSWER.slice(0, shown));
      if (shown >= ANSWER.length) {
        clearInterval(timer.current);
        setText(ANSWER);
        onDone?.();
      }
    }, 40);
  };
  return { text, start };
}

function history(count: number): ChatMessage[] {
  return Array.from({ length: count }, (_, index) => [
    {
      id: `hu${index}`,
      role: 'user' as const,
      parts: [{ type: 'text', text: `Question ${index + 1}` }],
    },
    {
      id: `ha${index}`,
      role: 'assistant' as const,
      parts: [
        { type: 'text', text: `Answer ${index + 1}: a short reply that fills a line or two.` },
      ],
    },
  ]).flat();
}

function StreamDemo({
  sendScroll,
  streamingCaret,
}: {
  sendScroll?: 'bottom' | 'prompt-top';
  streamingCaret?: boolean;
}) {
  const [streaming, setStreaming] = useState(false);
  const [sent, setSent] = useState(false);
  const { text, start } = useStream(() => setStreaming(false));
  const messages: ChatMessage[] = [
    ...history(6),
    ...(sent
      ? [
          {
            id: 'ask',
            role: 'user' as const,
            parts: [{ type: 'text', text: 'Why does the token refresh fail after a retry?' }],
          },
        ]
      : []),
    ...(text
      ? [{ id: 'answer', role: 'assistant' as const, parts: [{ type: 'text', text }] }]
      : []),
  ];
  return (
    <Frame
      controls={
        <Button
          size="xs"
          w="fit-content"
          disabled={streaming}
          onClick={() => {
            setSent(true);
            setStreaming(true);
            start();
          }}
        >
          Send
        </Button>
      }
    >
      <MessageList
        messages={messages}
        status={streaming ? 'streaming' : 'ready'}
        sendScroll={sendScroll}
        streamingCaret={streamingCaret}
      />
    </Frame>
  );
}

function getScroller(canvasElement: HTMLElement): HTMLElement {
  const scroller = canvasElement.querySelector<HTMLElement>('[role="log"]');
  if (!scroller) {
    throw new Error('Scroll container not found');
  }
  return scroller;
}

export function PromptTop() {
  return <StreamDemo sendScroll="prompt-top" />;
}

PromptTop.play = async ({ canvasElement }: Canvas) => {
  const canvas = within(canvasElement);
  await userEvent.click(canvas.getByRole('button', { name: 'Send' }));
  const scroller = getScroller(canvasElement);
  const turn = await waitFor(() => {
    const element = scroller.querySelector<HTMLElement>('[data-turn-key="ask"]');
    if (!element) {
      throw new Error('The sent turn is not rendered yet');
    }
    return element;
  });
  await waitFor(() =>
    expect(
      Math.abs(turn.getBoundingClientRect().top - scroller.getBoundingClientRect().top)
    ).toBeLessThan(8)
  );
};

export function StreamingCaret() {
  return <StreamDemo streamingCaret />;
}

StreamingCaret.play = async ({ canvasElement }: Canvas) => {
  const canvas = within(canvasElement);
  await userEvent.click(canvas.getByRole('button', { name: 'Send' }));
  await waitFor(() => expect(canvasElement.querySelector('[data-caret]')).not.toBeNull());
};

function HostActionDemo() {
  const [pinned, setPinned] = useState<string[]>([]);
  return (
    <Frame controls={<Badge variant="light">{`Pinned: ${pinned.join(', ') || 'none'}`}</Badge>}>
      <MessageList
        messages={CHART_MESSAGES}
        status="ready"
        partRenderers={PART_RENDERERS}
        messageActions={{
          onRetry: () => {},
          actions: (messageId, role) =>
            role === 'assistant' ? (
              <MessageActionButton
                label={pinned.includes(messageId) ? 'Unpin' : 'Pin'}
                icon={
                  pinned.includes(messageId) ? <IconPinFilled size={16} /> : <IconPin size={16} />
                }
                active={pinned.includes(messageId)}
                onClick={() =>
                  setPinned((current) =>
                    current.includes(messageId)
                      ? current.filter((id) => id !== messageId)
                      : [...current, messageId]
                  )
                }
              />
            ) : null,
        }}
      />
    </Frame>
  );
}

export function HostAction() {
  return <HostActionDemo />;
}

HostAction.play = async ({ canvasElement }: Canvas) => {
  const canvas = within(canvasElement);
  await userEvent.click(canvas.getByRole('button', { name: 'Pin' }));
  await expect(canvas.getByText('Pinned: a1')).toBeVisible();
  await expect(canvas.getByRole('button', { name: 'Unpin' })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
};

const LONG = history(500);

export function LongTranscript() {
  return (
    <Frame>
      <MessageList messages={LONG} status="ready" lazyTurns />
    </Frame>
  );
}

LongTranscript.play = async ({ canvasElement }: Canvas) => {
  performance.mark('long-transcript-start');
  const scroller = getScroller(canvasElement);
  scroller.scrollTop = 0;
  scroller.scrollTop = scroller.scrollHeight;
  performance.measure('long-transcript-scroll', 'long-transcript-start');
  await expect(canvasElement.querySelectorAll('[data-lazy]').length).toBe(499);
};
