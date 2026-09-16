import React from 'react';
import { render, screen } from '@mantine-tests/core';
import type { ChatMessage } from '../types';
import { MessageList } from './MessageList';

const messages: ChatMessage[] = [
  {
    id: 'u1',
    role: 'user',
    parts: [{ type: 'text', text: 'Hello there' }],
  },
  {
    id: 'a1',
    role: 'assistant',
    parts: [{ type: 'text', text: 'Hi! I am **ready** to help.' }],
  },
];

describe('MessageList', () => {
  it('renders user and assistant text', () => {
    render(<MessageList messages={messages} status="ready" />);
    expect(screen.getByText('Hello there')).toBeInTheDocument();
    expect(screen.getByText('ready')).toBeInTheDocument();
    expect(screen.getByText(/to help/)).toBeInTheDocument();
  });

  it('shows the processing row while waiting for the assistant', () => {
    render(<MessageList messages={[messages[0]]} status="submitted" />);
    expect(screen.getByText('Processing...')).toBeInTheDocument();
  });

  it('renders error parts as ErrorMessage', () => {
    const withError: ChatMessage[] = [
      messages[0],
      {
        id: 'a-err',
        role: 'assistant',
        parts: [{ type: 'error', title: 'Request failed', message: 'Boom' }],
      },
    ];
    render(<MessageList messages={withError} status="error" />);
    expect(screen.getByText('Request failed')).toBeInTheDocument();
    expect(screen.getByText('Boom')).toBeInTheDocument();
  });

  it('accepts legacy content string messages', () => {
    const legacy = [{ id: 'u1', role: 'user', parts: [], content: 'Legacy text' }] as ChatMessage[];
    render(<MessageList messages={legacy} status="ready" />);
    expect(screen.getByText('Legacy text')).toBeInTheDocument();
  });
});
