import React from 'react';
import { MantineProvider } from '@mantine/core';
import { act, fireEvent, render as rtlRender, screen } from '@testing-library/react';
import { quietPresentation } from '../quiet/quiet-presentation';
import type { ChatMessage, PartRendererProps, PartRenderers } from '../types';
import { MessageList } from './MessageList';

function render(ui: React.ReactElement) {
  return rtlRender(ui, {
    wrapper: ({ children }) => <MantineProvider env="test">{children}</MantineProvider>,
  });
}

const renders = jest.fn();

function Chart({ part, messageId, index }: PartRendererProps<{ type: string; title: string }>) {
  renders(messageId);
  return <figure data-index={index}>{part.title}</figure>;
}

const registry: PartRenderers = { 'data-chart': Chart };

function transcript(extra: ChatMessage[] = []): ChatMessage[] {
  return [
    { id: 'u1', role: 'user', parts: [{ type: 'text', text: 'Plot it' }] },
    {
      id: 'a1',
      role: 'assistant',
      parts: [
        { type: 'text', text: 'Here it is' },
        { type: 'data-chart', title: 'Revenue' } as never,
        { type: 'data-secret', value: 1 } as never,
      ],
    },
    ...extra,
  ];
}

describe('MessageList additions', () => {
  beforeEach(() => renders.mockClear());

  it('renders a registered part type and keeps an unknown one hidden', () => {
    render(<MessageList messages={transcript()} status="ready" partRenderers={registry} />);
    expect(screen.getByText('Revenue')).toHaveAttribute('data-index', '1');
    expect(screen.queryByText('data-secret')).toBeNull();
    expect(document.querySelector('[data-value]')).toBeNull();
  });

  it('keeps the default behaviour without a registry', () => {
    render(<MessageList messages={transcript()} status="ready" />);
    expect(screen.queryByText('Revenue')).toBeNull();
  });

  it('hands registered parts to a presentation as entries', () => {
    render(
      <MessageList
        messages={transcript()}
        status="ready"
        partRenderers={registry}
        presentation={quietPresentation}
      />
    );
    expect(screen.getByText('Revenue')).toBeInTheDocument();
  });

  it('does not re-render a finished row while a new answer streams', () => {
    const finished = transcript([
      { id: 'u2', role: 'user', parts: [{ type: 'text', text: 'More' }] },
    ]);
    const next = (text: string): ChatMessage[] => [
      ...finished,
      { id: 'a2', role: 'assistant', parts: [{ type: 'text', text }] },
    ];
    const { rerender } = render(
      <MessageList messages={next('a')} status="streaming" partRenderers={registry} />
    );
    const before = renders.mock.calls.length;
    rerender(<MessageList messages={next('ab')} status="streaming" partRenderers={registry} />);
    rerender(<MessageList messages={next('abc')} status="streaming" partRenderers={registry} />);
    expect(renders.mock.calls.length).toBe(before);
  });

  it('is a log that is busy while the answer streams and announces the end once', () => {
    const { rerender, container } = render(
      <MessageList messages={transcript()} status="streaming" />
    );
    const log = container.querySelector('[role="log"]')!;
    expect(log).toHaveAttribute('aria-busy', 'true');
    expect(log).toHaveAttribute('aria-live', 'off');
    const status = screen.getByRole('status', { hidden: true });
    expect(status).toHaveTextContent('');

    rerender(<MessageList messages={transcript()} status="ready" />);
    expect(log).toHaveAttribute('aria-busy', 'false');
    expect(status).toHaveTextContent('Answer ready');

    rerender(<MessageList messages={[...transcript()]} status="ready" />);
    expect(status).toHaveTextContent('Answer ready');

    rerender(<MessageList messages={transcript()} status="streaming" />);
    rerender(
      <MessageList
        messages={transcript()}
        status="error"
        labels={{ answerFailed: 'Ответ прерван ошибкой' }}
      />
    );
    expect(status).toHaveTextContent('Ответ прерван ошибкой');

    rerender(<MessageList messages={transcript()} status="streaming" />);
    rerender(<MessageList messages={transcript()} status="streaming" stopped />);
    rerender(<MessageList messages={transcript()} status="ready" stopped />);
    expect(status).toHaveTextContent('Answer stopped');
  });

  it('scrolls to the bottom instead when a whole new conversation arrives', () => {
    const { rerender, container } = render(
      <MessageList messages={transcript()} status="ready" sendScroll="prompt-top" />
    );
    const list = container.querySelector<HTMLElement>('[role="log"]')!;
    Object.defineProperty(list, 'scrollHeight', { configurable: true, value: 5_000 });
    list.scrollTop = 0;
    act(() => {
      rerender(
        <MessageList
          messages={[{ id: 'other-u', role: 'user', parts: [{ type: 'text', text: 'Hello' }] }]}
          status="submitted"
          sendScroll="prompt-top"
        />
      );
    });
    expect(list.scrollTop).toBe(5_000);
  });

  it('stays quiet about renderers that keep their identity', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const { rerender } = render(
      <MessageList messages={transcript()} status="ready" partRenderers={registry} />
    );
    for (let index = 0; index < 4; index += 1) {
      rerender(<MessageList messages={transcript()} status="ready" partRenderers={registry} />);
    }
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it('warns once in development when the renderers are a new object on every render', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const { rerender } = render(
      <MessageList messages={transcript()} status="ready" partRenderers={{ ...registry }} />
    );
    for (let index = 0; index < 4; index += 1) {
      rerender(
        <MessageList messages={transcript()} status="ready" partRenderers={{ ...registry }} />
      );
    }
    rerender(
      <MessageList messages={transcript()} status="ready" partRenderers={{ ...registry }} />
    );
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toMatch(/partRenderers/);
    warn.mockRestore();
  });

  it('puts a sent question at the top instead of scrolling to the bottom', () => {
    const { rerender, container } = render(
      <MessageList messages={transcript()} status="ready" sendScroll="prompt-top" />
    );
    const list = container.querySelector<HTMLElement>('[role="log"]')!;
    Object.defineProperty(list, 'scrollHeight', { configurable: true, value: 5_000 });
    list.getBoundingClientRect = () => ({ top: 100 }) as DOMRect;
    const originalRect = HTMLElement.prototype.getBoundingClientRect;
    HTMLElement.prototype.getBoundingClientRect = function rect(this: HTMLElement) {
      return (
        this.dataset.turnKey === 'u2' ? { top: 100 + 800 - list.scrollTop } : { top: 0, height: 0 }
      ) as DOMRect;
    };
    list.scrollTop = 200;

    act(() => {
      rerender(
        <MessageList
          messages={transcript([
            { id: 'u2', role: 'user', parts: [{ type: 'text', text: 'Next' }] },
          ])}
          status="submitted"
          sendScroll="prompt-top"
        />
      );
    });
    HTMLElement.prototype.getBoundingClientRect = originalRect;

    expect(list.scrollTop).toBe(800);
    expect(container.querySelector('[data-turn-key="u2"]')).toHaveAttribute('data-send-scroll');
    expect(container.querySelector('[data-turn-key="u1"]')).not.toHaveAttribute('data-send-scroll');
  });

  it('marks finished turns for lazy layout from the given count', () => {
    const many: ChatMessage[] = Array.from({ length: 4 }, (_, index) => [
      { id: `u${index}`, role: 'user' as const, parts: [{ type: 'text', text: `Q${index}` }] },
      { id: `a${index}`, role: 'assistant' as const, parts: [{ type: 'text', text: `A${index}` }] },
    ]).flat();
    const { container, rerender } = render(
      <MessageList messages={many} status="ready" lazyTurns={3} />
    );
    const lazy = () => container.querySelectorAll('[data-lazy]').length;
    expect(lazy()).toBe(3);
    rerender(<MessageList messages={many} status="ready" lazyTurns={5} />);
    expect(lazy()).toBe(0);
    rerender(<MessageList messages={many} status="ready" />);
    expect(lazy()).toBe(0);
  });

  it('shows the caret only while the answer streams, and only when asked', () => {
    const streaming: ChatMessage[] = [
      { id: 'u1', role: 'user', parts: [{ type: 'text', text: 'Hi' }] },
      { id: 'a1', role: 'assistant', parts: [{ type: 'text', text: 'Hel' }] },
    ];
    const { container, rerender } = render(
      <MessageList messages={streaming} status="streaming" streamingCaret />
    );
    expect(container.querySelector('[data-caret]')).not.toBeNull();
    rerender(<MessageList messages={streaming} status="ready" streamingCaret />);
    expect(container.querySelector('[data-caret]')).toBeNull();
    rerender(<MessageList messages={streaming} status="streaming" />);
    expect(container.querySelector('[data-caret]')).toBeNull();
  });

  it('lets a host button sit in the message toolbar', () => {
    const onPin = jest.fn();
    render(
      <MessageList
        messages={transcript()}
        status="ready"
        messageActions={{
          onRetry: () => {},
          actions: (id, role) =>
            role === 'assistant' ? (
              <button type="button" onClick={() => onPin(id)}>
                Pin
              </button>
            ) : null,
        }}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Pin' }));
    expect(onPin).toHaveBeenCalledWith('a1');
  });
});
