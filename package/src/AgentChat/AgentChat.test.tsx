import React from 'react';
import { render, screen, userEvent } from '@mantine-tests/core';
import type { ChatMessage, ChatSlots } from '../types';
import { AgentChat } from './AgentChat';

const StubInputBar: ChatSlots['InputBar'] = ({ onSend, status }) => (
  <div>
    <span>status:{status}</span>
    <button type="button" onClick={() => onSend({ role: 'user', content: 'hello from stub' })}>
      send
    </button>
  </div>
);

const messages: ChatMessage[] = [
  { id: 'u1', role: 'user', parts: [{ type: 'text', text: 'First question' }] },
  { id: 'a1', role: 'assistant', parts: [{ type: 'text', text: 'First answer' }] },
];

describe('AgentChat', () => {
  it('calls onSend from the input bar', async () => {
    const onSend = jest.fn();
    render(
      <AgentChat
        messages={messages}
        status="ready"
        onSend={onSend}
        onStop={() => {}}
        slots={{ InputBar: StubInputBar }}
      />
    );
    await userEvent.click(screen.getByRole('button', { name: 'send' }));
    expect(onSend).toHaveBeenCalledWith({ role: 'user', content: 'hello from stub' });
    expect(screen.getByText('First question')).toBeInTheDocument();
    expect(screen.getByText('First answer')).toBeInTheDocument();
  });

  it('renders error as a synthetic assistant message', () => {
    render(
      <AgentChat
        messages={messages}
        status="error"
        error={new Error('Kaboom')}
        onSend={() => {}}
        onStop={() => {}}
        slots={{ InputBar: StubInputBar }}
      />
    );
    expect(screen.getByText('Request failed')).toBeInTheDocument();
    expect(screen.getByText('Kaboom')).toBeInTheDocument();
  });

  it('renders centered empty state without a message list', () => {
    render(
      <AgentChat
        messages={[]}
        status="ready"
        onSend={() => {}}
        onStop={() => {}}
        emptyStatePosition="center"
        slots={{ InputBar: StubInputBar }}
      />
    );
    const stub = screen.getByText('status:ready');
    expect(stub.closest('[data-empty-centered]')).not.toBeNull();
    expect(screen.queryByRole('toolbar')).toBeNull();
  });
});
