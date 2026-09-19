import React, { Profiler } from 'react';
import { MantineProvider } from '@mantine/core';
import { render } from '@testing-library/react';
import type { ChatMessage, PartRendererProps, PartRenderers } from '../types';
import { MessageList } from './MessageList';

const TURNS = 200;
const TOKENS = 100;
const finishedRenders = jest.fn();

function Probe({ messageId }: PartRendererProps) {
  finishedRenders(messageId);
  return null;
}

const registry: PartRenderers = { 'data-probe': Probe };

const history: ChatMessage[] = Array.from({ length: TURNS - 1 }, (_, index) => [
  { id: `u${index}`, role: 'user' as const, parts: [{ type: 'text', text: `Question ${index}` }] },
  {
    id: `a${index}`,
    role: 'assistant' as const,
    parts: [{ type: 'text', text: `Answer ${index}` }, { type: 'data-probe' } as never],
  },
]).flat();
const lastQuestion: ChatMessage = {
  id: 'u-last',
  role: 'user',
  parts: [{ type: 'text', text: 'Last question' }],
};

function withAnswer(text: string): ChatMessage[] {
  return [
    ...history,
    lastQuestion,
    { id: 'a-last', role: 'assistant', parts: [{ type: 'text', text }] },
  ];
}

describe('MessageList performance', () => {
  it('keeps finished turns out of the render while a long answer streams', () => {
    let commits = 0;
    const list = (text: string) => (
      <MantineProvider env="test">
        <Profiler id="list" onRender={() => (commits += 1)}>
          <MessageList
            messages={withAnswer(text)}
            status="streaming"
            partRenderers={registry}
            sendScroll="prompt-top"
            streamingCaret
            lazyTurns
          />
        </Profiler>
      </MantineProvider>
    );
    const { rerender } = render(list('t'));
    expect(finishedRenders).toHaveBeenCalledTimes(TURNS - 1);
    finishedRenders.mockClear();

    let text = 't';
    for (let token = 0; token < TOKENS; token += 1) {
      text += ' token';
      rerender(list(text));
    }

    expect(finishedRenders).not.toHaveBeenCalled();
    expect(commits).toBeGreaterThanOrEqual(TOKENS);
  });
});
