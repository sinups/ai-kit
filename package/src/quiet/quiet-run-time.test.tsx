import React from 'react';
import { MantineProvider } from '@mantine/core';
import { act, render as rtlRender, screen } from '@testing-library/react';
import { MessageList } from '../MessageList/MessageList';
import type { ChatMessage, ChatStatus, ToolPart } from '../types';
import { quietPresentation } from './quiet-presentation';

const catalog = { mcp__x__one: { title: 'Первый' }, mcp__x__two: { title: 'Второй' } };

function call(id: string, name: string, state: ToolPart['state']): ToolPart {
  return {
    type: `tool-${name}`,
    toolCallId: id,
    state,
    input: {},
    ...(state === 'output-available'
      ? { output: { content: [{ type: 'text', text: 'ok' }] } }
      : {}),
  } as ToolPart;
}

const answer = { type: 'text', text: 'Нашёл, теперь второе' };

function list(parts: unknown[], status: ChatStatus) {
  const messages = [
    { id: 'u1', role: 'user', parts: [{ type: 'text', text: 'Вопрос' }] },
    { id: 'a1', role: 'assistant', parts },
  ] as ChatMessage[];
  return (
    <MantineProvider env="test">
      <MessageList
        messages={messages}
        status={status}
        presentation={quietPresentation}
        toolCatalog={catalog}
        workingRow={false}
      />
    </MantineProvider>
  );
}

const lines = () => screen.getAllByText(/tool/).map((node) => node.textContent);

describe('QuietToolRun time', () => {
  it('counts a later run from the end of the one before it', () => {
    jest.useFakeTimers();
    const start = Date.now();
    const { rerender } = rtlRender(
      list([call('a', 'mcp__x__one', 'input-available')], 'streaming')
    );

    jest.setSystemTime(start + 4000);
    rerender(list([call('a', 'mcp__x__one', 'output-available'), answer], 'streaming'));

    jest.setSystemTime(start + 7000);
    rerender(
      list(
        [
          call('a', 'mcp__x__one', 'output-available'),
          answer,
          call('b', 'mcp__x__two', 'input-available'),
        ],
        'streaming'
      )
    );

    jest.setSystemTime(start + 7300);
    rerender(
      list(
        [
          call('a', 'mcp__x__one', 'output-available'),
          answer,
          call('b', 'mcp__x__two', 'output-available'),
          { type: 'text', text: 'Готово' },
        ],
        'ready'
      )
    );

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(lines()).toEqual(['Used 1 tool · 4s', 'Used 1 tool · 3s']);
    jest.useRealTimers();
  });
});
