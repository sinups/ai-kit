import React from 'react';
import { render, screen } from '@mantine-tests/core';
import { act, fireEvent } from '@testing-library/react';
import type { ChatMessage, ToolPart } from '../types';
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

function readCall(id: string): ToolPart {
  return {
    type: 'tool-Read',
    toolCallId: id,
    state: 'output-available',
    input: { file_path: `src/${id}.ts` },
    output: 'done',
  };
}

function transcript(parts: Array<ToolPart | { type: 'text'; text: string }>): ChatMessage[] {
  return [
    { id: 'u1', role: 'user', parts: [{ type: 'text', text: 'Read the files' }] },
    { id: 'a1', role: 'assistant', parts },
  ] as ChatMessage[];
}

const messages = transcript([
  { type: 'text', text: 'Reading them now.' },
  readCall('a'),
  readCall('b'),
]);

let setList: (next: ChatMessage[]) => void = () => {};

function Harness({ initial }: { initial: ChatMessage[] }) {
  const [list, setListState] = React.useState(initial);
  setList = setListState;
  return <MessageList messages={list} status="streaming" presentation="rows" workingRow />;
}

describe('MessageList/rows presentation', () => {
  it('keeps the cards until the mode is asked for', () => {
    const { container } = render(<MessageList messages={messages} status="ready" />);

    expect(container.querySelector('[data-rows]')).toBeNull();
    expect(screen.queryByText('(src/a.ts)')).toBeNull();
  });

  it('lays the calls out as flat rows with one rhythm', () => {
    const { container } = render(
      <MessageList messages={messages} status="ready" presentation="rows" />
    );

    expect(screen.getByText('(src/a.ts)')).toBeInTheDocument();
    expect(screen.getByText('(src/b.ts)')).toBeInTheDocument();
    expect(container.querySelectorAll('[data-rows]').length).toBeGreaterThan(0);
  });

  it('never collapses a run of calls in this mode', () => {
    render(
      <MessageList
        messages={transcript([readCall('a'), readCall('b'), readCall('c')])}
        status="ready"
        presentation="rows"
        collapseToolRuns
      />
    );

    expect(screen.getByText('(src/a.ts)')).toBeInTheDocument();
    expect(screen.getByText('(src/b.ts)')).toBeInTheDocument();
    expect(screen.getByText('(src/c.ts)')).toBeInTheDocument();
  });

  it('holds the bottom when a row arrives after a pause', () => {
    const metrics = { scrollHeight: 4000, clientHeight: 500 };
    const { container } = render(<Harness initial={messages} />);
    const scroller = getScroller(container);
    fakeMetrics(scroller, metrics);
    scroller.scrollTop = metrics.scrollHeight - metrics.clientHeight;
    fireEvent.scroll(scroller);

    metrics.scrollHeight += 80;
    act(() =>
      setList(
        transcript([
          { type: 'text', text: 'Reading them now.' },
          readCall('a'),
          readCall('b'),
          readCall('c'),
        ])
      )
    );
    expect(scroller.scrollTop).toBe(metrics.scrollHeight - metrics.clientHeight);

    metrics.scrollHeight += 80;
    act(() =>
      setList(
        transcript([
          { type: 'text', text: 'Reading them now.' },
          readCall('a'),
          readCall('b'),
          readCall('c'),
          readCall('d'),
        ])
      )
    );
    expect(scroller.scrollTop).toBe(metrics.scrollHeight - metrics.clientHeight);
  });

  it('keeps the working line of the mode at the end of the transcript', () => {
    render(<Harness initial={messages} />);
    expect(screen.getByText('Working')).toBeInTheDocument();
  });
});
