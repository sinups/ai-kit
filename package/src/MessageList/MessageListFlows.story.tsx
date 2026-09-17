import React, { useState } from 'react';
import { Button, Paper, Stack } from '@mantine/core';
import { expect, fn, userEvent, waitFor, within } from '@storybook/test';
import { PlanApproval } from '../message-actions/PlanApproval/PlanApproval';
import type { MessageListActions } from '../message-actions/types';
import type { ChatMessage, CustomToolRendererProps, ToolActionHandler } from '../types';
import { longConversation } from './feed-fixtures';
import { compactedConversation, errorConversation, toolRunConversation } from './fixtures';
import { MessageList } from './MessageList';

export default { title: 'MessageList/Flows' };

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

function getScroller(canvasElement: HTMLElement) {
  const turn = canvasElement.querySelector<HTMLElement>('[data-turn-key]');
  let element = turn?.parentElement ?? null;
  while (element && getComputedStyle(element).overflowY !== 'auto') {
    element = element.parentElement;
  }
  if (!element) {
    throw new Error('Scroll container not found');
  }
  return element;
}

function scrollTo(element: HTMLElement, top: number) {
  element.scrollTop = top;
  element.dispatchEvent(new Event('scroll'));
}

const shortConversation: ChatMessage[] = [
  { id: 'u1', role: 'user', parts: [{ type: 'text', text: 'Refactor the auth module' }] },
  { id: 'a1', role: 'assistant', parts: [{ type: 'text', text: 'Moved the token store out.' }] },
];

export function SearchFlow() {
  return (
    <Frame>
      <MessageList
        messages={longConversation}
        status="ready"
        searchable
        initialScrollBehavior="top"
      />
    </Frame>
  );
}

SearchFlow.play = async ({ canvasElement }: Canvas) => {
  const canvas = within(canvasElement);
  await userEvent.click(canvas.getByText('Why does the token refresh fail after a retry?'));
  await userEvent.keyboard('{Control>}f{/Control}');
  const input = await canvas.findByRole('textbox', { name: 'Search conversation' });
  await waitFor(() => expect(input).toHaveFocus());
  await userEvent.type(input, 'revoked');
  await expect(await canvas.findByText('1/16')).toBeVisible();
  await userEvent.keyboard('{Enter}');
  await expect(canvas.getByText('2/16')).toBeVisible();
  await userEvent.keyboard('{Shift>}{Enter}{/Shift}{Shift>}{Enter}{/Shift}');
  await expect(canvas.getByText('16/16')).toBeVisible();
  await userEvent.keyboard('{Escape}');
  await waitFor(() => expect(canvas.queryByRole('search')).not.toBeInTheDocument());
};

export function NewMessagesFlow() {
  const [messages, setMessages] = useState<ChatMessage[]>(longConversation);
  return (
    <Frame
      controls={
        <Button
          size="compact-xs"
          w="fit-content"
          onClick={() =>
            setMessages((current) => [
              ...current,
              ...[1, 2, 3].map((index) => ({
                id: `bg-${current.length}-${index}`,
                role: 'assistant' as const,
                parts: [{ type: 'text', text: `Background task ${index} finished.` }],
              })),
            ])
          }
        >
          Receive 3 messages
        </Button>
      }
    >
      <MessageList messages={messages} status="ready" />
    </Frame>
  );
}

NewMessagesFlow.play = async ({ canvasElement }: Canvas) => {
  const canvas = within(canvasElement);
  const scroller = getScroller(canvasElement);
  await waitFor(() =>
    expect(scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight).toBeLessThan(80)
  );
  scrollTo(scroller, 200);
  await userEvent.click(canvas.getByRole('button', { name: 'Receive 3 messages' }));
  const jump = await canvas.findByRole('button', { name: '3 new messages' });
  await expect(scroller.scrollTop).toBe(200);
  await userEvent.click(jump);
  await waitFor(
    () =>
      expect(scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight).toBeLessThan(80),
    { timeout: 3000 }
  );
  await waitFor(() => expect(canvas.queryByRole('button', { name: /new messages/ })).toBeNull());
  await expect(canvas.getByText('Background task 3 finished.')).toBeVisible();
};

export function StickyPromptFlow() {
  return (
    <Frame>
      <MessageList
        messages={longConversation}
        status="ready"
        stickyPrompt
        initialScrollBehavior="top"
      />
    </Frame>
  );
}

StickyPromptFlow.play = async ({ canvasElement }: Canvas) => {
  const canvas = within(canvasElement);
  const scroller = getScroller(canvasElement);
  const secondTurn = canvasElement.querySelector<HTMLElement>('[data-turn-key="u2"]')!;
  scrollTo(scroller, secondTurn.offsetTop + 600);
  const prompt = await canvas.findByRole('button', { name: 'Scroll to the prompt' });
  await expect(prompt).toHaveTextContent('How should the retry read the token then?');
  await userEvent.click(prompt);
  await waitFor(
    () => expect(canvas.queryByRole('button', { name: 'Scroll to the prompt' })).toBeNull(),
    { timeout: 3000 }
  );
};

export function CollapseToolRunsFlow() {
  return (
    <Frame>
      <MessageList
        messages={toolRunConversation}
        status="ready"
        collapseToolRuns
        initialScrollBehavior="top"
      />
    </Frame>
  );
}

CollapseToolRunsFlow.play = async ({ canvasElement }: Canvas) => {
  const run = canvasElement.querySelector<HTMLElement>('[data-tool-run]')!;
  await expect(run).toBeInTheDocument();
  const toggle = within(run).getAllByRole('button')[0];
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await userEvent.click(toggle);
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await waitFor(() => expect(within(run).getByText(/backoff\.ts/)).toBeVisible());
};

export function CompactionFlow() {
  return (
    <Frame>
      <MessageList messages={compactedConversation} status="ready" initialScrollBehavior="top" />
    </Frame>
  );
}

CompactionFlow.play = async ({ canvasElement }: Canvas) => {
  const canvas = within(canvasElement);
  const toggle = canvas.getByRole('button', { name: /History summarized/ });
  await userEvent.click(toggle);
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await waitFor(() => expect(canvas.getByText('Tests for backoff are green')).toBeVisible());
};

export const RetryFlow = {
  args: { onRetry: fn() },
  render: ({ onRetry }: { onRetry: () => void }) => (
    <Frame>
      <MessageList messages={errorConversation} status="error" onRetry={onRetry} />
    </Frame>
  ),
  play: async ({ canvasElement, args }: Canvas & { args: { onRetry: () => void } }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('The upstream model timed out after 60s.')).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: /retry|try again/i }));
    await expect(args.onRetry).toHaveBeenCalledTimes(1);
  },
};

function PlanRenderer({ part, onAction }: CustomToolRendererProps) {
  const input = part.input as { plan: { title: string; summary: string } };
  return (
    <PlanApproval
      plan={input.plan}
      onApprove={() => onAction?.('approve')}
      onReject={(feedback) => onAction?.('reject', { feedback })}
    />
  );
}

const planConversation: ChatMessage[] = [
  shortConversation[0],
  {
    id: 'a-plan',
    role: 'assistant',
    parts: [
      {
        type: 'tool-PlanWrite',
        toolCallId: 'plan-1',
        state: 'input-available',
        input: { plan: { title: 'Extract the token store', summary: '1. Move\n2. Test' } },
      },
    ],
  },
];

export const ToolActionFlow = {
  args: { onToolAction: fn() },
  render: ({ onToolAction }: { onToolAction: ToolActionHandler }) => (
    <Frame>
      <MessageList
        messages={planConversation}
        status="ready"
        toolRenderers={{ 'tool-PlanWrite': PlanRenderer }}
        onToolAction={onToolAction}
        initialScrollBehavior="top"
      />
    </Frame>
  ),
  play: async ({ canvasElement, args }: Canvas & { args: { onToolAction: ToolActionHandler } }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Reject with feedback' }));
    await userEvent.type(canvas.getByLabelText('Why is the plan rejected?'), 'Too broad');
    await userEvent.click(canvas.getByRole('button', { name: 'Reject' }));
    await expect(args.onToolAction).toHaveBeenCalledWith('plan-1', 'reject', {
      feedback: 'Too broad',
    });
    await expect(await canvas.findByText('Rejected')).toBeVisible();
  },
};

type ActionArgs = Required<
  Pick<MessageListActions, 'onEdit' | 'onRetry' | 'onRewind' | 'onFeedback' | 'onBranch'>
>;

export const MessageActionsFlow = {
  args: { onEdit: fn(), onRetry: fn(), onRewind: fn(), onFeedback: fn(), onBranch: fn() },
  render: (args: ActionArgs) => {
    function Harness() {
      const [messages, setMessages] = useState(shortConversation);
      return (
        <MessageList
          messages={messages}
          status="ready"
          initialScrollBehavior="top"
          messageActions={{
            ...args,
            onEdit: (messageId, text) => {
              args.onEdit(messageId, text);
              setMessages((current) =>
                current.map((message) =>
                  message.id === messageId
                    ? { ...message, parts: [{ type: 'text', text }] }
                    : message
                )
              );
            },
          }}
        />
      );
    }
    return (
      <Frame>
        <Harness />
      </Frame>
    );
  },
  play: async ({ canvasElement, args }: Canvas & { args: ActionArgs }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole('button', { name: 'Retry' }));
    await expect(args.onRetry).toHaveBeenCalledWith('a1');

    await userEvent.click(canvas.getByRole('button', { name: 'Branch from here' }));
    await expect(args.onBranch).toHaveBeenCalledWith('a1');

    await userEvent.click(canvas.getByRole('button', { name: 'Rewind to here' }));
    await expect(args.onRewind).toHaveBeenCalledWith('u1');

    await userEvent.click(canvas.getByRole('button', { name: 'Good response' }));
    await expect(args.onFeedback).toHaveBeenCalledWith('a1', 'up');
    await expect(await page.findByText('Thanks for your feedback')).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');

    await userEvent.click(canvas.getByRole('button', { name: 'Bad response' }));
    await userEvent.click(await page.findByRole('checkbox', { name: 'Inaccurate' }));
    await userEvent.click(page.getByRole('button', { name: 'Send feedback' }));
    await expect(args.onFeedback).toHaveBeenCalledWith('a1', 'down', {
      reasons: ['inaccurate'],
      comment: '',
    });
    await userEvent.keyboard('{Escape}');

    await userEvent.click(canvas.getByRole('button', { name: 'Edit' }));
    const editor = canvas.getByRole('textbox', { name: 'Edit message' });
    await userEvent.type(editor, ' and add tests{Enter}');
    await expect(args.onEdit).toHaveBeenCalledWith('u1', 'Refactor the auth module and add tests');
    await expect(await canvas.findByText('Refactor the auth module and add tests')).toBeVisible();
    await waitFor(() => expect(canvas.getByRole('button', { name: 'Edit' })).toHaveFocus());
  },
};

export function TopFadeFlow() {
  return (
    <Frame>
      <MessageList messages={longConversation} status="ready" topFade initialScrollBehavior="top" />
    </Frame>
  );
}

TopFadeFlow.play = async ({ canvasElement }: Canvas) => {
  const scroller = getScroller(canvasElement);
  await expect(scroller).not.toHaveAttribute('data-top-fade');
  scrollTo(scroller, 300);
  await waitFor(() => expect(scroller).toHaveAttribute('data-top-fade'));
  await expect(getComputedStyle(scroller).maskImage).toContain('linear-gradient');
  scrollTo(scroller, 0);
  await waitFor(() => expect(scroller).not.toHaveAttribute('data-top-fade'));
};
