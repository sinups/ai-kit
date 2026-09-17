import React from 'react';
import { render, screen, userEvent } from '@mantine-tests/core';
import { act, fireEvent, waitFor } from '@testing-library/react';
import type { ChatMessage, ToolRendererSlotProps } from '../types';
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

describe('MessageList/MessageList', () => {
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

  it('does not show the processing row when the chat is ready', () => {
    render(<MessageList messages={[messages[0]]} status="ready" />);
    expect(screen.queryByText('Processing...')).toBeNull();
  });

  it('suppressQuestionToolCallId hides only the matching question part', () => {
    const StubToolRenderer = ({ part }: ToolRendererSlotProps) => <div>tool:{part.toolCallId}</div>;
    const withQuestions: ChatMessage[] = [
      messages[0],
      {
        id: 'a-q',
        role: 'assistant',
        parts: [
          { type: 'tool-Question', toolCallId: 'q-old', state: 'output-available' },
          { type: 'tool-Question', toolCallId: 'q-pending', state: 'input-available' },
        ],
      },
    ];
    render(
      <MessageList
        messages={withQuestions}
        status="ready"
        slots={{ ToolRenderer: StubToolRenderer }}
        suppressQuestionToolCallId="q-pending"
      />
    );
    expect(screen.getByText('tool:q-old')).toBeInTheDocument();
    expect(screen.queryByText('tool:q-pending')).toBeNull();
  });

  it('collapses consecutive read and search tools when enabled', () => {
    const read = (id: string) => ({
      type: 'tool-Read',
      toolCallId: id,
      state: 'output-available',
      input: { file_path: `src/${id}.ts` },
      output: '',
    });
    const withTools: ChatMessage[] = [
      messages[0],
      {
        id: 'a-tools',
        role: 'assistant',
        parts: [
          read('r1'),
          read('r2'),
          {
            type: 'tool-Grep',
            toolCallId: 'g1',
            state: 'output-available',
            input: { pattern: 'retry' },
            output: { numFiles: 1 },
          },
        ],
      },
    ];
    const { unmount } = render(
      <MessageList messages={withTools} status="ready" collapseToolRuns />
    );
    expect(screen.getByText('Read 2 files')).toBeInTheDocument();
    expect(screen.getByText('searched 1 pattern')).toBeInTheDocument();
    unmount();

    render(<MessageList messages={withTools} status="ready" />);
    expect(screen.queryByText('Read 2 files')).not.toBeInTheDocument();
  });

  it('renders compaction parts from system messages', () => {
    const compacted: ChatMessage[] = [
      {
        id: 's1',
        role: 'system',
        parts: [
          { type: 'text', text: 'hidden system prompt' },
          { type: 'compaction', tokensBefore: 90_000, tokensAfter: 4_000 },
        ],
      },
      ...messages,
    ];
    render(<MessageList messages={compacted} status="ready" />);
    expect(screen.getByText('History summarized · 90k → 4k tokens')).toBeInTheDocument();
    expect(screen.queryByText('hidden system prompt')).not.toBeInTheDocument();
  });
  it('renders message actions instead of the copy toolbar when messageActions is set', async () => {
    const onRetry = jest.fn();
    const onRewind = jest.fn();
    const onFeedback = jest.fn();
    const { unmount } = render(<MessageList messages={messages} status="ready" />);
    expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument();
    unmount();

    render(
      <MessageList
        messages={messages}
        status="ready"
        messageActions={{ onRetry, onRewind, onFeedback }}
      />
    );
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalledWith('a1');
    await userEvent.click(screen.getByRole('button', { name: 'Rewind to here' }));
    expect(onRewind).toHaveBeenCalledWith('u1');
    await userEvent.click(screen.getByRole('button', { name: 'Good response' }));
    expect(onFeedback).toHaveBeenCalledWith('a1', 'up');
    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
  });

  it('edits a user message inline', async () => {
    const onEdit = jest.fn();
    render(<MessageList messages={messages} status="ready" messageActions={{ onEdit }} />);

    await userEvent.click(screen.getByRole('button', { name: 'Edit' }));
    const input = screen.getByRole('textbox', { name: 'Edit message' });
    expect(input).toHaveValue('Hello there');
    await userEvent.type(input, ' again{Enter}');

    expect(onEdit).toHaveBeenCalledWith('u1', 'Hello there again');
    await waitFor(() =>
      expect(screen.queryByRole('textbox', { name: 'Edit message' })).not.toBeInTheDocument()
    );
    await waitFor(() => expect(screen.getByRole('button', { name: 'Edit' })).toHaveFocus());
  });

  it('hides assistant actions while the last turn is streaming', () => {
    render(
      <MessageList messages={messages} status="streaming" messageActions={{ onRetry: () => {} }} />
    );
    expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument();
  });

  it('shows known slash commands as chips', () => {
    const withCommand: ChatMessage[] = [
      { id: 'u1', role: 'user', parts: [{ type: 'text', text: '/review src/auth' }] },
    ];
    render(<MessageList messages={withCommand} status="ready" commands={[{ name: 'review' }]} />);
    expect(screen.getByText('review')).toBeInTheDocument();
    expect(screen.getByText('src/auth')).toBeInTheDocument();
  });

  it('keeps the retry action under the last turn when the chat failed', async () => {
    const onRetry = jest.fn();
    const failed: ChatMessage[] = [
      messages[0],
      { id: 'a-part', role: 'assistant', parts: [{ type: 'text', text: 'Partial answer' }] },
      { id: 'a-err', role: 'assistant', parts: [{ type: 'error', message: 'Overloaded' }] },
    ];
    render(<MessageList messages={failed} status="error" messageActions={{ onRetry }} />);
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalledWith('a-part');
  });

  it('adds a retry button to error parts and hides message actions for error-only turns', async () => {
    const onRetry = jest.fn();
    const failed: ChatMessage[] = [
      messages[0],
      { id: 'a-err', role: 'assistant', parts: [{ type: 'error', message: 'Overloaded' }] },
    ];
    render(
      <MessageList
        messages={failed}
        status="error"
        onRetry={onRetry}
        messageActions={{ onRetry: () => {}, onFeedback: () => {} }}
      />
    );
    expect(screen.getAllByRole('button', { name: 'Retry' })).toHaveLength(1);
    expect(screen.queryByRole('button', { name: 'Good response' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('renders turn summaries, context events and hook activity, including from system messages', () => {
    const feed: ChatMessage[] = [
      messages[0],
      {
        id: 'a-feed',
        role: 'assistant',
        parts: [
          { type: 'context-event', kind: 'file', label: 'src/auth.ts' },
          { type: 'text', text: 'Done.' },
          { type: 'turn-summary', durationMs: 123_000, tokens: 40_000, tokenBudget: 100_000 },
        ],
      },
      {
        id: 's-hooks',
        role: 'system',
        parts: [{ type: 'hook-activity', event: 'Stop', status: 'done', hooks: [{ name: 'a' }] }],
      },
    ];
    render(<MessageList messages={feed} status="ready" />);
    expect(screen.getByText('Read')).toBeInTheDocument();
    expect(screen.getByText('Took 2m 3s · 40k / 100k')).toBeInTheDocument();
    expect(screen.getByText('Ran 1 Stop hook')).toBeInTheDocument();
  });

  describe('scrolling', () => {
    type Observer = { callback: ResizeObserverCallback };
    let observers: Observer[];
    const OriginalResizeObserver = window.ResizeObserver;

    beforeEach(() => {
      observers = [];
      window.ResizeObserver = class {
        callback: ResizeObserverCallback;
        constructor(callback: ResizeObserverCallback) {
          this.callback = callback;
          observers.push(this);
        }
        observe() {}
        unobserve() {}
        disconnect() {}
      } as unknown as typeof ResizeObserver;
      Element.prototype.scrollTo = jest.fn();
    });

    afterEach(() => {
      window.ResizeObserver = OriginalResizeObserver;
    });

    function fakeMetrics(
      element: HTMLElement,
      metrics: { scrollHeight: number; clientHeight: number }
    ) {
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
      return container.querySelector<HTMLElement>('.mantine-Box-root, [class]')!;
    }

    it('follows a tall block that arrives in one piece while pinned to the bottom', () => {
      const metrics = { scrollHeight: 1000, clientHeight: 400 };
      const { container } = render(<MessageList messages={messages} status="streaming" />);
      const scroller = getScroller(container);
      fakeMetrics(scroller, metrics);
      scroller.scrollTop = 600;
      fireEvent.scroll(scroller);

      metrics.scrollHeight = 2600;
      const content = scroller.firstElementChild as HTMLElement;
      content.getBoundingClientRect = () => ({ height: 2600 }) as DOMRect;
      act(() => observers.forEach((observer) => observer.callback([], observer as never)));

      expect(scroller.scrollTop).toBe(2200);
    });

    it('stays put and offers a jump button when the reader scrolled up', async () => {
      const metrics = { scrollHeight: 2000, clientHeight: 400 };
      let setList: (next: ChatMessage[]) => void = () => {};
      function Harness() {
        const [list, setListState] = React.useState(messages);
        setList = setListState;
        return <MessageList messages={list} status="ready" />;
      }
      const { container } = render(<Harness />);
      const scroller = getScroller(container);
      fakeMetrics(scroller, metrics);
      scroller.scrollTop = 1600;
      fireEvent.scroll(scroller);
      scroller.scrollTop = 300;
      fireEvent.scroll(scroller);

      const more: ChatMessage[] = [
        ...messages,
        {
          id: 'a2',
          role: 'assistant',
          parts: [{ type: 'text', text: 'Background task finished' }],
        },
        { id: 'a3', role: 'assistant', parts: [{ type: 'text', text: 'Tests are green' }] },
      ];
      act(() => setList(more));
      const content = scroller.firstElementChild as HTMLElement;
      content.getBoundingClientRect = () => ({ height: 2400 }) as DOMRect;
      act(() => observers.forEach((observer) => observer.callback([], observer as never)));
      expect(scroller.scrollTop).toBe(300);

      await userEvent.click(screen.getByRole('button', { name: '2 new messages' }));
      expect(Element.prototype.scrollTo).toHaveBeenCalledWith({ top: 2000, behavior: 'smooth' });
      expect(screen.queryByRole('button', { name: /new messages/ })).not.toBeInTheDocument();
    });
  });

  it('searches the conversation with Mod+F', async () => {
    const { container } = render(
      <MessageList
        status="ready"
        withSearch
        messages={[
          { id: 'u1', role: 'user', parts: [{ type: 'text', text: 'Refresh the token' }] },
          {
            id: 'a1',
            role: 'assistant',
            parts: [{ type: 'text', text: 'The token is refreshed.' }],
          },
        ]}
      />
    );
    const scroller = container.querySelector<HTMLElement>('[tabindex="-1"]')!;
    fireEvent.keyDown(scroller, { key: 'f', ctrlKey: true });
    const input = await screen.findByRole('textbox', { name: 'Search conversation' });
    await userEvent.type(input, 'token');
    expect(await screen.findByText('1/2')).toBeInTheDocument();
    await userEvent.type(input, '{Enter}');
    expect(screen.getByText('2/2')).toBeInTheDocument();
    await userEvent.type(input, '{Escape}');
    expect(screen.queryByRole('search')).not.toBeInTheDocument();
  });

  it('passes the highlighter to answers and streams only the last assistant text', async () => {
    const highlighter = jest.fn(() => [[{ content: 'const x = 1;', color: 'red' }]]);
    const code: ChatMessage[] = [
      messages[0],
      { id: 'a-old', role: 'assistant', parts: [{ type: 'text', text: 'Earlier answer' }] },
      {
        id: 'a-live',
        role: 'assistant',
        parts: [
          { type: 'text', text: 'First part' },
          { type: 'text', text: '```ts\nconst x = 1;\n```' },
        ],
      },
    ];
    const { container, rerender } = render(
      <MessageList messages={code} status="streaming" highlighter={highlighter} />
    );
    await waitFor(() =>
      expect(highlighter).toHaveBeenCalledWith(expect.stringContaining('const x = 1;'), 'ts')
    );
    expect(container.querySelectorAll('[data-streaming]')).toHaveLength(1);
    expect(container.querySelector('[data-streaming]')).toHaveTextContent('const x = 1;');

    rerender(<MessageList messages={code} status="ready" highlighter={highlighter} />);
    expect(container.querySelectorAll('[data-streaming]')).toHaveLength(0);
  });

  it('fades the top edge only after scrolling when topFade is on', () => {
    const { container, rerender } = render(
      <MessageList messages={messages} status="ready" topFade />
    );
    const scroller = container.querySelector<HTMLElement>('[class*="root"]')!;
    expect(scroller).not.toHaveAttribute('data-top-fade');
    Object.defineProperty(scroller, 'scrollTop', { configurable: true, value: 40 });
    fireEvent.scroll(scroller);
    expect(scroller).toHaveAttribute('data-top-fade');
    Object.defineProperty(scroller, 'scrollTop', { configurable: true, value: 0 });
    fireEvent.scroll(scroller);
    expect(scroller).not.toHaveAttribute('data-top-fade');

    rerender(<MessageList messages={messages} status="ready" />);
    Object.defineProperty(scroller, 'scrollTop', { configurable: true, value: 40 });
    fireEvent.scroll(scroller);
    expect(scroller).not.toHaveAttribute('data-top-fade');
  });

  it('wraps long lines in code blocks and diffs only with wrapLines', () => {
    const wide: ChatMessage[] = [
      messages[0],
      {
        id: 'a-wide',
        role: 'assistant',
        parts: [
          { type: 'text', text: '```ts\nconst veryLongLine = 1;\n```' },
          {
            type: 'tool-Edit',
            toolCallId: 'e1',
            state: 'output-available',
            input: {
              file_path: 'src/a.ts',
              old_string: 'const a = 1;',
              new_string: 'const a = 2;',
            },
          },
        ],
      },
    ];
    const { container, unmount } = render(<MessageList messages={wide} status="ready" />);
    expect(container.querySelectorAll('[data-wrap]')).toHaveLength(0);
    unmount();

    const wrapped = render(<MessageList messages={wide} status="ready" wrapLines />);
    expect(wrapped.container.querySelectorAll('pre[data-wrap]')).toHaveLength(1);
    expect(wrapped.container.querySelectorAll('[data-wrap]').length).toBeGreaterThanOrEqual(2);
  });
});
