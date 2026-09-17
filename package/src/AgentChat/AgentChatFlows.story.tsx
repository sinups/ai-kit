import React from 'react';
import { ActionIcon, Paper, Text } from '@mantine/core';
import { IconBrain } from '@tabler/icons-react';
import { expect, fn, userEvent, waitFor, within } from '@storybook/test';
import { conversation } from '../MessageList/fixtures';
import { AgentChat } from './AgentChat';

export default { title: 'AgentChat/Flows' };

type Canvas = { canvasElement: HTMLElement };

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <Paper
      withBorder
      radius={0}
      h={600}
      maw={560}
      m="xl"
      display="flex"
      style={{ flexDirection: 'column' }}
    >
      {children}
    </Paper>
  );
}

type SendArgs = {
  onSend: (message: { role: 'user'; content: string }) => void;
  onStop: () => void;
};

export const SendFlow = {
  args: { onSend: fn(), onStop: fn() },
  render: ({ onSend, onStop }: SendArgs) => (
    <Frame>
      <AgentChat messages={conversation} status="ready" onSend={onSend} onStop={onStop} />
    </Frame>
  ),
  play: async ({ canvasElement, args }: Canvas & { args: SendArgs }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByPlaceholderText('Send a message...');
    await userEvent.type(input, '  Add a regression test  {Enter}');
    await expect(args.onSend).toHaveBeenCalledWith({
      role: 'user',
      content: 'Add a regression test',
    });
    await waitFor(() => expect(input).toHaveValue(''));
  },
};

export const StopFlow = {
  args: { onSend: fn(), onStop: fn() },
  render: ({ onSend, onStop }: SendArgs) => (
    <Frame>
      <AgentChat messages={conversation} status="streaming" onSend={onSend} onStop={onStop} />
    </Frame>
  ),
  play: async ({ canvasElement, args }: Canvas & { args: SendArgs }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: /stop/i }));
    await expect(args.onStop).toHaveBeenCalledTimes(1);
    await expect(args.onSend).not.toHaveBeenCalled();
  },
};

type RetryArgs = SendArgs & { onRetry: () => void };

export const RetryFlow = {
  args: { onSend: fn(), onStop: fn(), onRetry: fn() },
  render: ({ onSend, onStop, onRetry }: RetryArgs) => (
    <Frame>
      <AgentChat
        messages={conversation}
        status="error"
        error={new Error('The model is overloaded')}
        onRetry={onRetry}
        onSend={onSend}
        onStop={onStop}
      />
    </Frame>
  ),
  play: async ({ canvasElement, args }: Canvas & { args: RetryArgs }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText('The model is overloaded')).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: /retry|try again/i }));
    await expect(args.onRetry).toHaveBeenCalledTimes(1);
  },
};

export function SearchFromComposerFlow() {
  return (
    <Frame>
      <AgentChat
        messages={conversation}
        status="ready"
        withSearch
        onSend={() => {}}
        onStop={() => {}}
      />
    </Frame>
  );
}

SearchFromComposerFlow.play = async ({ canvasElement }: Canvas) => {
  const canvas = within(canvasElement);
  await userEvent.click(canvas.getByPlaceholderText('Send a message...'));
  await userEvent.keyboard('{Control>}f{/Control}');
  const search = await canvas.findByRole('textbox', { name: 'Search conversation' });
  await waitFor(() => expect(search).toHaveFocus());
  await userEvent.type(search, 'refresh');
  await expect(await canvas.findByText(/^1\/\d+$/)).toBeVisible();
  await userEvent.keyboard('{Escape}');
  await waitFor(() => expect(canvas.queryByRole('search')).toBeNull());
};

type ComposerArgs = SendArgs & { onEffort: () => void };

export const ComposerPropsFlow = {
  args: { onSend: fn(), onStop: fn(), onEffort: fn() },
  // The docs source snippet serializes JSX nested in the `inputBarProps` object and overflows the stack.
  parameters: { docs: { source: { type: 'code' } } },
  render: ({ onSend, onStop, onEffort }: ComposerArgs) => (
    <Frame>
      <AgentChat
        messages={conversation}
        status="ready"
        onSend={onSend}
        onStop={onStop}
        statusBar={<Text size="xs">Agent is idle</Text>}
        inputBarProps={{
          placeholder: 'Ask the agent',
          leftActions: (
            <ActionIcon
              variant="subtle"
              color="gray"
              aria-label="Reasoning effort"
              onClick={() => onEffort()}
            >
              <IconBrain size={16} />
            </ActionIcon>
          ),
        }}
      />
    </Frame>
  ),
  play: async ({ canvasElement, args }: Canvas & { args: ComposerArgs }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Agent is idle')).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Reasoning effort' }));
    await expect(args.onEffort).toHaveBeenCalledTimes(1);
    await userEvent.type(canvas.getByPlaceholderText('Ask the agent'), 'Hi{Enter}');
    await expect(args.onSend).toHaveBeenCalledWith({ role: 'user', content: 'Hi' });
  },
};

export const EmptyStateFlow = {
  args: { onSend: fn(), onStop: fn() },
  render: ({ onSend, onStop }: SendArgs) => (
    <Frame>
      <AgentChat
        messages={[]}
        status="ready"
        onSend={onSend}
        onStop={onStop}
        emptyState={{
          title: 'What should we work on?',
          description: 'Ask about the code, run tests or plan a change',
          suggestions: [
            {
              id: 'explain',
              label: 'Explain this repo',
              value: 'Explain what this repository does.',
            },
            {
              id: 'tests',
              label: 'Run tests',
              value: 'Run the test suite and summarize failures.',
            },
          ],
        }}
      />
    </Frame>
  ),
  play: async ({ canvasElement, args }: Canvas & { args: SendArgs }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('heading', { name: 'What should we work on?' })).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Run tests' }));
    const input = canvas.getByPlaceholderText('Send a message...');
    await waitFor(() => expect(input).toHaveValue('Run the test suite and summarize failures.'));
    await userEvent.type(input, '{Enter}');
    await expect(args.onSend).toHaveBeenCalledWith({
      role: 'user',
      content: 'Run the test suite and summarize failures.',
    });
  },
};

type WelcomeArgs = SendArgs & { onOpenDocs: () => void };

export const WelcomeFlow = {
  args: { onSend: fn(), onStop: fn(), onOpenDocs: fn() },
  parameters: { docs: { source: { type: 'code' } } },
  render: ({ onSend, onStop, onOpenDocs }: WelcomeArgs) => (
    <Frame>
      <AgentChat
        messages={[]}
        status="ready"
        onSend={onSend}
        onStop={onStop}
        alignComposer
        emptyState={{
          avatar: <IconBrain size={22} />,
          title: 'How can I help you today?',
          actions: [
            {
              id: 'bug',
              label: 'Find the cause of a bug',
              value: 'Help me find why ',
              badge: 'New',
            },
            { id: 'tests', label: 'Write tests for a file', value: 'Write tests for ' },
            { id: 'docs', label: 'Open the docs', onSelect: () => onOpenDocs() },
          ],
        }}
      />
    </Frame>
  ),
  play: async ({ canvasElement, args }: Canvas & { args: WelcomeArgs }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('heading', { name: 'How can I help you today?' })).toBeVisible();
    const input = canvas.getByPlaceholderText('Send a message...');

    await userEvent.click(canvas.getByRole('button', { name: /Find the cause of a bug/ }));
    await waitFor(() => expect(input).toHaveValue('Help me find why '));
    await waitFor(() => expect(input).toHaveFocus());
    await expect(args.onSend).not.toHaveBeenCalled();

    canvas.getByRole('button', { name: /Find the cause of a bug/ }).focus();
    await userEvent.keyboard('{ArrowDown}');
    await expect(canvas.getByRole('button', { name: 'Write tests for a file' })).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(input).toHaveValue('Write tests for '));

    await userEvent.click(canvas.getByRole('button', { name: 'Open the docs' }));
    await expect(args.onOpenDocs).toHaveBeenCalledTimes(1);

    await userEvent.type(input, 'auth.ts{Enter}');
    await expect(args.onSend).toHaveBeenCalledWith({
      role: 'user',
      content: 'Write tests for auth.ts',
    });
  },
};
