import React from 'react';
import { MantineProvider } from '@mantine/core';
import { fireEvent, render, screen } from '@testing-library/react';
import type { ChatMessage } from '../types';
import { AgentChat } from './AgentChat';

function wrapper({ children }: { children: React.ReactNode }) {
  return <MantineProvider env="test">{children}</MantineProvider>;
}

const messages: ChatMessage[] = [
  { id: 'u1', role: 'user', parts: [{ type: 'text', text: 'Write a poem' }] },
  { id: 'a1', role: 'assistant', parts: [{ type: 'text', text: 'Roses are' }] },
];

describe('AgentChat stop', () => {
  it('announces a stopped answer as stopped, and the next one as ready', () => {
    const onStop = jest.fn();
    const chat = (status: 'streaming' | 'ready') => (
      <AgentChat messages={messages} status={status} onSend={() => {}} onStop={onStop} />
    );
    const { rerender } = render(chat('streaming'), { wrapper });
    fireEvent.click(screen.getByRole('button', { name: 'Stop' }));
    expect(onStop).toHaveBeenCalledTimes(1);
    rerender(chat('ready'));
    const status = screen.getByRole('status', { hidden: true });
    expect(status).toHaveTextContent('Answer stopped');

    rerender(chat('streaming'));
    rerender(chat('ready'));
    expect(status).toHaveTextContent('Answer ready');
  });
});
