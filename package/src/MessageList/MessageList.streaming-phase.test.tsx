import React from 'react';
import { render, screen } from '@mantine-tests/core';
import { act } from '@testing-library/react';
import type { ChatMessage } from '../types';
import { MessageList } from './MessageList';

it('keeps an explicit activity node mounted while streamed text grows', () => {
  let update!: (next: 'submitted' | 'streaming' | 'ready') => void;
  function Harness() {
    const [status, setStatus] = React.useState<'submitted' | 'streaming' | 'ready'>('submitted');
    update = setStatus;
    return (
      <MessageList
        messages={[
          {
            id: 'a1',
            role: 'assistant',
            parts: status === 'submitted' ? [] : [{ type: 'text', text: 'Answer' }],
          },
        ]}
        status={status}
        workingRow={<span data-testid="activity">Working</span>}
      />
    );
  }
  render(<Harness />);
  const node = screen.getByTestId('activity');
  act(() => update('streaming'));
  expect(screen.getByTestId('activity')).toBe(node);
  act(() => update('ready'));
  expect(screen.queryByTestId('activity')).toBeNull();
});

it('keeps the reveal buffer active during submitted tool phases without a typing caret', () => {
  Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
  jest.useFakeTimers();
  const message = (text: string): ChatMessage[] => [
    { id: 'a1', role: 'assistant', parts: [{ type: 'text', text }] },
  ];
  let update!: (value: { text: string; status: 'streaming' | 'submitted' }) => void;
  function Harness() {
    const [state, setState] = React.useState<{ text: string; status: 'streaming' | 'submitted' }>({
      text: 'Start ',
      status: 'streaming',
    });
    update = setState;
    return (
      <MessageList
        messages={message(state.text)}
        status={state.status}
        frameBatched
        streamingCaret
      />
    );
  }
  const view = render(<Harness />);
  const answer = 'Start a large burst that should not jump into view at once.';
  act(() => update({ text: answer, status: 'streaming' }));
  act(() => update({ text: answer, status: 'submitted' }));
  expect(view.container.textContent).not.toContain(answer);
  expect(view.container.querySelector('[data-caret]')).toBeNull();
  jest.useRealTimers();
});

it('flushes the buffer only when the turn is settled', () => {
  const messages: ChatMessage[] = [
    { id: 'a1', role: 'assistant', parts: [{ type: 'text', text: 'Answer' }] },
  ];
  const view = render(
    <MessageList messages={messages} status="ready" frameBatched streamingCaret />
  );
  expect(view.container.textContent).toContain('Answer');
});
