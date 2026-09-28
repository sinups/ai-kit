import React from 'react';
import { MantineProvider } from '@mantine/core';
import { render as rtlRender } from '@testing-library/react';
import type { ChatMessage } from '../types';
import { MessageList } from './MessageList';

function render(ui: React.ReactElement) {
  return rtlRender(ui, {
    wrapper: ({ children }) => <MantineProvider env="test">{children}</MantineProvider>,
  });
}

const question: ChatMessage[] = [
  { id: 'u1', role: 'user', parts: [{ type: 'text', text: 'How much is the Team plan?' }] },
];

const conversation: ChatMessage[] = [
  ...question,
  { id: 'a1', role: 'assistant', parts: [{ type: 'text', text: 'Five seats.' }] },
];

const list = (messages: ChatMessage[], props: Record<string, unknown> = {}) => (
  <MantineProvider env="test">
    <MessageList messages={messages} status="streaming" {...props} />
  </MantineProvider>
);

const space = (container: HTMLElement) => container.querySelector('[data-breathing-space]');

describe('MessageList breathing space', () => {
  it('keeps room under a live answer and releases it when the turn is finished', () => {
    const { container, rerender } = render(list(question));
    rerender(list(conversation));
    expect(space(container)).toBeInTheDocument();

    rerender(
      <MantineProvider env="test">
        <MessageList messages={conversation} status="ready" />
      </MantineProvider>
    );
    expect(space(container)).toBeNull();
  });

  it('gives no room when the host turns it off', () => {
    const { container, rerender } = render(list(question, { assistantBreathingSpace: false }));
    rerender(list(conversation, { assistantBreathingSpace: false }));
    expect(space(container)).toBeNull();
  });

  it('stacks a short transcript at the composer only when asked', () => {
    const { container, rerender } = render(<MessageList messages={conversation} status="ready" />);
    expect(container.querySelector('[data-stack-from-bottom]')).toBeNull();

    rerender(
      <MantineProvider env="test">
        <MessageList messages={conversation} status="ready" stackFromBottom />
      </MantineProvider>
    );
    expect(container.querySelector('[data-stack-from-bottom]')).toBeInTheDocument();
  });
});
