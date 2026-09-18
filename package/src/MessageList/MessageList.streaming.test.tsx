import React from 'react';
import { render, screen } from '@mantine-tests/core';
import { act, fireEvent } from '@testing-library/react';
import type { ChatMessage, ToolRendererSlotProps } from '../types';
import { MessageList } from './MessageList';

type Metrics = { scrollHeight: number; clientHeight: number };

function fakeMetrics(element: HTMLElement, metrics: Metrics) {
  let scrollTop = 0;
  Object.defineProperty(element, 'scrollHeight', {
    configurable: true,
    get: () => metrics.scrollHeight,
  });
  Object.defineProperty(element, 'clientHeight', {
    configurable: true,
    get: () => metrics.clientHeight,
  });
  Object.defineProperty(element, 'scrollTop', {
    configurable: true,
    get: () => scrollTop,
    set: (value: number) => {
      scrollTop = Math.max(0, Math.min(value, metrics.scrollHeight - metrics.clientHeight));
    },
  });
}

function getScroller(container: HTMLElement) {
  return container.querySelector<HTMLElement>('[class]')!;
}

function transcript(turns: number): ChatMessage[] {
  const messages: ChatMessage[] = [];
  for (let index = 0; index < turns; index += 1) {
    messages.push({
      id: `u${index}`,
      role: 'user',
      parts: [{ type: 'text', text: `Question ${index}` }],
    });
    messages.push({
      id: `a${index}`,
      role: 'assistant',
      parts: [
        {
          type: 'tool-Read',
          toolCallId: `t${index}`,
          state: 'output-available',
          input: { file_path: `src/file-${index}.ts` },
          output: 'done',
        },
      ],
    } as ChatMessage);
  }
  return messages;
}

function streamingMessage(text: string): ChatMessage {
  return { id: 'live', role: 'assistant', parts: [{ type: 'text', text }] };
}

describe('MessageList/streaming', () => {
  let setList: (next: ChatMessage[]) => void = () => {};

  function Harness({
    initial,
    slots,
  }: {
    initial: ChatMessage[];
    slots?: React.ComponentProps<typeof MessageList>['slots'];
  }) {
    const [list, setListState] = React.useState(initial);
    setList = setListState;
    return (
      <MessageList
        messages={list}
        status="streaming"
        slots={slots}
        onToolAction={() => {}}
        onRetry={() => {}}
      />
    );
  }

  describe('follow the bottom', () => {
    function setup(metrics: Metrics, initial: ChatMessage[]) {
      const { container } = render(<Harness initial={initial} />);
      const scroller = getScroller(container);
      fakeMetrics(scroller, metrics);
      scroller.scrollTop = metrics.scrollHeight - metrics.clientHeight;
      fireEvent.scroll(scroller);
      return scroller;
    }

    it('keeps the viewport pinned while deltas stream into a long list', () => {
      const metrics = { scrollHeight: 4000, clientHeight: 500 };
      const base = transcript(12);
      const scroller = setup(metrics, [...base, streamingMessage('Answer')]);
      expect(scroller.scrollTop).toBe(3500);

      for (let delta = 0; delta < 10; delta += 1) {
        metrics.scrollHeight += 40;
        act(() => setList([...base, streamingMessage(`Answer ${'word '.repeat(delta + 1)}`)]));
      }

      expect(scroller.scrollTop).toBe(metrics.scrollHeight - metrics.clientHeight);
    });

    it('does not jump when a card at the bottom collapses', () => {
      const metrics = { scrollHeight: 4000, clientHeight: 500 };
      const base = transcript(12);
      const scroller = setup(metrics, [...base, streamingMessage('Answer')]);
      scroller.scrollTop = 3200;
      fireEvent.scroll(scroller);

      metrics.scrollHeight = 3400;
      scroller.scrollTop = 3200;
      fireEvent.scroll(scroller);
      expect(scroller.scrollTop).toBe(2900);

      act(() => setList([...base, streamingMessage('Answer with more text')]));
      expect(scroller.scrollTop).toBe(2900);
    });

    it('detaches when the reader scrolls up and re-attaches at the bottom', () => {
      const metrics = { scrollHeight: 4000, clientHeight: 500 };
      const base = transcript(12);
      const scroller = setup(metrics, [...base, streamingMessage('Answer')]);

      scroller.scrollTop = 1200;
      fireEvent.scroll(scroller);
      metrics.scrollHeight = 4200;
      act(() => setList([...base, streamingMessage('Answer grows')]));
      expect(scroller.scrollTop).toBe(1200);

      scroller.scrollTop = metrics.scrollHeight - metrics.clientHeight;
      fireEvent.scroll(scroller);
      metrics.scrollHeight = 4400;
      act(() => setList([...base, streamingMessage('Answer grows further')]));
      expect(scroller.scrollTop).toBe(3900);
    });
  });

  it('renders finished turns once while 200 deltas stream into the last message', () => {
    const renders = new Map<string, number>();
    function CountingTool({ part }: ToolRendererSlotProps) {
      const id = String(part.toolCallId);
      renders.set(id, (renders.get(id) ?? 0) + 1);
      return <div data-tool-id={id} />;
    }

    const base = transcript(20);
    render(
      <Harness
        initial={[...base, streamingMessage('token ')]}
        slots={{ ToolRenderer: CountingTool }}
      />
    );
    const afterMount = [...renders.values()].reduce((sum, count) => sum + count, 0);
    expect(afterMount).toBe(20);

    let text = 'token ';
    for (let delta = 0; delta < 200; delta += 1) {
      text += 'token ';
      act(() => setList([...base, streamingMessage(text)]));
    }

    const total = [...renders.values()].reduce((sum, count) => sum + count, 0);
    expect(total).toBe(afterMount);
    expect(screen.getByText(/token/)).toBeInTheDocument();
  });
});

describe('MessageList/render scope', () => {
  function setup(turns: number) {
    const renders = new Map<string, number>();
    function CountingTool({ part }: ToolRendererSlotProps) {
      const id = String(part.toolCallId);
      renders.set(id, (renders.get(id) ?? 0) + 1);
      return <div data-tool-id={id} />;
    }

    const base = transcript(turns);
    let setMessages: (next: ChatMessage[]) => void = () => {};
    let setStatus: (next: 'streaming' | 'ready') => void = () => {};

    function Harness() {
      const [list, setList] = React.useState<ChatMessage[]>([...base, streamingMessage('token ')]);
      const [status, setStatusState] = React.useState<'streaming' | 'ready'>('streaming');
      setMessages = setList;
      setStatus = setStatusState;
      return (
        <MessageList
          messages={list}
          status={status}
          slots={{ ToolRenderer: CountingTool }}
          onToolAction={() => {}}
          onRetry={() => {}}
        />
      );
    }

    render(<Harness />);
    return {
      base,
      renders,
      setMessages: (next: ChatMessage[]) => setMessages(next),
      setStatus: (next: 'streaming' | 'ready') => setStatus(next),
    };
  }

  it('renders each finished row once while 200 deltas stream into the last message', () => {
    const { base, renders, setMessages } = setup(150);
    expect(renders.size).toBe(150);
    expect([...renders.values()].every((count) => count === 1)).toBe(true);

    let text = 'token ';
    for (let delta = 0; delta < 200; delta += 1) {
      text += 'token ';
      act(() => setMessages([...base, streamingMessage(text)]));
    }

    expect([...renders.entries()].filter(([, count]) => count !== 1)).toEqual([]);
  });

  it('does not re-render finished rows when the chat status changes', () => {
    const { renders, setStatus } = setup(150);
    act(() => setStatus('ready'));
    expect([...renders.entries()].filter(([, count]) => count !== 1)).toEqual([]);
  });

  it('keeps updating the streaming row while the finished rows stay put', () => {
    const { base, renders, setMessages } = setup(20);
    act(() => setMessages([...base, streamingMessage('token token token ')]));

    expect(screen.getByText('token token token')).toBeInTheDocument();
    expect([...renders.entries()].filter(([, count]) => count !== 1)).toEqual([]);
  });
});
