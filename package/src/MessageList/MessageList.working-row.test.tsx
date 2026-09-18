import React from 'react';
import { render, screen } from '@mantine-tests/core';
import { act, fireEvent } from '@testing-library/react';
import type { ChatMessage, ChatStatus } from '../types';
import { ToolApprovalsProvider } from '../approvals/tool-approvals';
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

function toolCall(id: string): ChatMessage {
  return {
    id: `a-${id}`,
    role: 'assistant',
    parts: [
      {
        type: 'tool-Read',
        toolCallId: id,
        state: 'output-available',
        input: { file_path: `/repo/${id}.ts` },
        output: 'done',
      },
    ],
  } as ChatMessage;
}

const question: ChatMessage = {
  id: 'u1',
  role: 'user',
  parts: [{ type: 'text', text: 'Find the overdue tasks' }],
};

const betweenCalls: ChatMessage[] = [question, toolCall('t1')];

let setList: (next: ChatMessage[]) => void = () => {};

function Harness({
  initial,
  status = 'streaming',
  workingRow,
}: {
  initial: ChatMessage[];
  status?: ChatStatus;
  workingRow?: React.ReactNode | boolean;
}) {
  const [list, setListState] = React.useState(initial);
  setList = setListState;
  return <MessageList messages={list} status={status} workingRow={workingRow} />;
}

describe('MessageList/working row', () => {
  it('stays off without the prop', () => {
    render(<Harness initial={betweenCalls} />);
    expect(screen.queryByText('Working')).toBeNull();
  });

  it('holds the place of the answer while the agent works between calls', () => {
    render(<Harness initial={betweenCalls} workingRow />);
    expect(screen.getByText('Working')).toBeInTheDocument();
  });

  it('steps aside once the answer itself starts growing', () => {
    render(<Harness initial={betweenCalls} workingRow />);
    expect(screen.getByText('Working')).toBeInTheDocument();

    act(() =>
      setList([
        question,
        {
          id: 'a-t1',
          role: 'assistant',
          parts: [
            {
              type: 'tool-Read',
              toolCallId: 't1',
              state: 'output-available',
              input: { file_path: '/repo/t1.ts' },
              output: 'done',
            },
            { type: 'text', text: 'Three tasks are overdue' },
          ],
        } as ChatMessage,
      ])
    );

    expect(screen.queryByText('Working')).toBeNull();
  });

  it('is gone once the turn is over', () => {
    render(<Harness initial={betweenCalls} status="ready" workingRow />);
    expect(screen.queryByText('Working')).toBeNull();
  });

  it('gives the slot to the node of the host', () => {
    render(<Harness initial={betweenCalls} workingRow={<span>Reading tasks · 44s</span>} />);

    expect(screen.getByText('Reading tasks · 44s')).toBeInTheDocument();
    expect(screen.queryByText('Working')).toBeNull();
  });

  it('opens a turn with the working row instead of the planning row', () => {
    render(<Harness initial={[question]} workingRow />);

    expect(screen.getByText('Working')).toBeInTheDocument();
    expect(screen.queryByText('Processing...')).toBeNull();
  });

  it('names the planning row by the labels of the host when the working row is off', () => {
    render(
      <MessageList messages={[question]} status="submitted" labels={{ planning: 'Обрабатываю…' }} />
    );

    expect(screen.getByText('Обрабатываю…')).toBeInTheDocument();
    expect(screen.queryByText('Working')).toBeNull();
  });

  it('stays hidden while a call waits for the decision of the user', () => {
    const waiting = [
      question,
      {
        id: 'a-w',
        role: 'assistant',
        parts: [
          {
            type: 'tool-mcp__tracker__task_create',
            toolCallId: 'w1',
            state: 'input-available',
            input: { title: 'Проверить отчёт' },
          },
        ],
      },
    ] as ChatMessage[];

    const { rerender } = render(
      <ToolApprovalsProvider approvals={{ w1: { onApprove: () => {} } }}>
        <MessageList messages={waiting} status="streaming" workingRow />
      </ToolApprovalsProvider>
    );
    expect(screen.queryByText('Working')).toBeNull();

    rerender(
      <ToolApprovalsProvider
        approvals={{ w1: { onApprove: () => {}, outcome: { decision: 'approved' } } }}
      >
        <MessageList messages={waiting} status="streaming" workingRow />
      </ToolApprovalsProvider>
    );
    expect(screen.getByText('Working')).toBeInTheDocument();
  });

  it('keeps the list at the bottom when a card arrives after a long pause', () => {
    const metrics = { scrollHeight: 4000, clientHeight: 500 };
    const { container } = render(<Harness initial={betweenCalls} workingRow />);
    const scroller = getScroller(container);
    fakeMetrics(scroller, metrics);
    scroller.scrollTop = metrics.scrollHeight - metrics.clientHeight;
    fireEvent.scroll(scroller);
    expect(scroller.scrollTop).toBe(3500);

    metrics.scrollHeight += 120;
    act(() => setList([question, toolCall('t1'), toolCall('t2')]));
    expect(scroller.scrollTop).toBe(metrics.scrollHeight - metrics.clientHeight);

    metrics.scrollHeight += 120;
    act(() => setList([question, toolCall('t1'), toolCall('t2'), toolCall('t3')]));
    expect(scroller.scrollTop).toBe(metrics.scrollHeight - metrics.clientHeight);
  });
});
