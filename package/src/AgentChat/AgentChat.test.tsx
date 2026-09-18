import React from 'react';
import { render, screen, userEvent } from '@mantine-tests/core';
import { act, fireEvent, waitFor } from '@testing-library/react';
import type { ChatMessage, ChatSlots, CustomToolRendererProps } from '../types';
import { AgentChat, findPendingQuestion } from './AgentChat';

const StubInputBar: ChatSlots['InputBar'] = ({ onSend, status }) => (
  <div>
    <span>status:{status}</span>
    <button type="button" onClick={() => onSend({ role: 'user', content: 'hello from stub' })}>
      send
    </button>
  </div>
);

const messages: ChatMessage[] = [
  { id: 'u1', role: 'user', parts: [{ type: 'text', text: 'First question' }] },
  { id: 'a1', role: 'assistant', parts: [{ type: 'text', text: 'First answer' }] },
];

function withFakeFrames(run: (flush: () => void) => void) {
  const frames: FrameRequestCallback[] = [];
  const request = jest
    .spyOn(window, 'requestAnimationFrame')
    .mockImplementation((callback: FrameRequestCallback) => frames.push(callback));
  const cancel = jest.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
  try {
    run(() =>
      act(() => {
        frames.splice(0).forEach((frame) => frame(0));
      })
    );
  } finally {
    request.mockRestore();
    cancel.mockRestore();
  }
}

describe('AgentChat/AgentChat', () => {
  it('calls onSend from the input bar', async () => {
    const onSend = jest.fn();
    render(
      <AgentChat
        messages={messages}
        status="ready"
        onSend={onSend}
        onStop={() => {}}
        slots={{ InputBar: StubInputBar }}
      />
    );
    await userEvent.click(screen.getByRole('button', { name: 'send' }));
    expect(onSend).toHaveBeenCalledWith({ role: 'user', content: 'hello from stub' });
    expect(screen.getByText('First question')).toBeInTheDocument();
    expect(screen.getByText('First answer')).toBeInTheDocument();
  });

  it('renders error as a synthetic assistant message', () => {
    render(
      <AgentChat
        messages={messages}
        status="error"
        error={new Error('Kaboom')}
        onSend={() => {}}
        onStop={() => {}}
        slots={{ InputBar: StubInputBar }}
      />
    );
    expect(screen.getByText('Request failed')).toBeInTheDocument();
    expect(screen.getByText('Kaboom')).toBeInTheDocument();
  });

  it('renders centered empty state without a message list', () => {
    render(
      <AgentChat
        messages={[]}
        status="ready"
        onSend={() => {}}
        onStop={() => {}}
        emptyStatePosition="center"
        slots={{ InputBar: StubInputBar }}
      />
    );
    const stub = screen.getByText('status:ready');
    expect(stub.closest('[data-empty-centered]')).not.toBeNull();
    expect(screen.queryByRole('toolbar')).toBeNull();
  });

  describe('question tool', () => {
    const questions = [
      { kind: 'single', title: 'Pick a color', options: [{ id: 'red', label: 'Red' }] },
      { kind: 'single', title: 'Pick a size', options: [{ id: 'xl', label: 'XL' }] },
    ];

    const questionMessage = (id: string, part: Record<string, unknown> = {}): ChatMessage => ({
      id,
      role: 'assistant',
      parts: [
        {
          type: 'tool-Question',
          toolCallId: `call-${id}`,
          state: 'input-available',
          input: { questions },
          ...part,
        },
      ],
    });

    it('treats an unanswered question after the last user message as pending', () => {
      const pending = findPendingQuestion([...messages, questionMessage('q1')], undefined);
      expect(pending?.toolCallId).toBe('call-q1');
      expect(pending?.questions).toHaveLength(2);
    });

    it('ignores questions that precede the last user message', () => {
      const history: ChatMessage[] = [
        questionMessage('q1'),
        { id: 'u2', role: 'user', parts: [{ type: 'text', text: 'Never mind' }] },
      ];
      expect(findPendingQuestion(history, undefined)).toBeNull();
    });

    it('closes the question on output-error, output-available or any output', () => {
      expect(
        findPendingQuestion([questionMessage('q1', { state: 'output-error' })], undefined)
      ).toBeNull();
      expect(
        findPendingQuestion([questionMessage('q1', { state: 'output-available' })], undefined)
      ).toBeNull();
      expect(
        findPendingQuestion([questionMessage('q1', { output: 'done' })], undefined)
      ).toBeNull();
    });

    type StubQuestionBar = {
      onSubmit: (
        answer: { kind: 'single'; selectedIds: string[] },
        meta: { questionIndex: number }
      ) => void;
      onSkip?: (meta: { questionIndex: number }) => void;
    };

    const QuestionStubInputBar: ChatSlots['InputBar'] = ({ questionBar }) => {
      const bar = questionBar as StubQuestionBar | undefined;
      if (!bar) {
        return <span>no question</span>;
      }
      return (
        <div>
          <button
            type="button"
            onClick={() =>
              bar.onSubmit({ kind: 'single', selectedIds: ['xl'] }, { questionIndex: 2 })
            }
          >
            answer second
          </button>
          <button type="button" onClick={() => bar.onSkip?.({ questionIndex: 1 })}>
            skip
          </button>
        </div>
      );
    };

    it('passes the answered question by questionIndex and forwards skip', async () => {
      const onAnswer = jest.fn();
      render(
        <AgentChat
          messages={[...messages, questionMessage('q1')]}
          status="ready"
          onSend={() => {}}
          onStop={() => {}}
          slots={{ InputBar: QuestionStubInputBar }}
          questionTool={{ onAnswer }}
        />
      );

      await userEvent.click(screen.getByRole('button', { name: 'answer second' }));
      expect(onAnswer).toHaveBeenLastCalledWith({
        toolCallId: 'call-q1',
        question: questions[1],
        answer: { kind: 'single', selectedIds: ['xl'] },
      });

      await userEvent.click(screen.getByRole('button', { name: 'skip' }));
      expect(onAnswer).toHaveBeenLastCalledWith({
        toolCallId: 'call-q1',
        question: questions[0],
        answer: { kind: 'skip' },
      });
      expect(onAnswer).toHaveBeenCalledTimes(2);
    });
  });

  it('passes inputBarProps to the composer and renders the status bar', () => {
    const InputBarProbe: ChatSlots['InputBar'] = ({
      placeholder,
      leftActions,
      labels,
      onQueue,
    }) => (
      <div>
        <span>placeholder:{placeholder}</span>
        {leftActions}
        <span>queued:{labels?.queued}</span>
        <span>queue:{typeof onQueue}</span>
      </div>
    );
    render(
      <AgentChat
        messages={messages}
        status="ready"
        onSend={() => {}}
        onStop={() => {}}
        slots={{ InputBar: InputBarProbe }}
        statusBar={<span>agent is idle</span>}
        inputBarProps={{
          placeholder: 'Ask the agent',
          leftActions: <span>effort</span>,
          labels: { queued: 'Up next' },
          onQueue: () => {},
        }}
      />
    );
    expect(screen.getByText('placeholder:Ask the agent')).toBeInTheDocument();
    expect(screen.getByText('effort')).toBeInTheDocument();
    expect(screen.getByText('queued:Up next')).toBeInTheDocument();
    expect(screen.getByText('queue:function')).toBeInTheDocument();
    expect(screen.getByText('agent is idle')).toBeInTheDocument();
  });

  it('retries a failed request from the error card', async () => {
    const onRetry = jest.fn();
    render(
      <AgentChat
        messages={messages}
        status="error"
        error={new Error('Kaboom')}
        onRetry={onRetry}
        onSend={() => {}}
        onStop={() => {}}
        slots={{ InputBar: StubInputBar }}
      />
    );
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('routes tool actions from custom renderers', async () => {
    const onToolAction = jest.fn();
    const Approve = ({ onAction, name }: CustomToolRendererProps) => (
      <button type="button" onClick={() => onAction?.('approve', { edits: '' })}>
        approve {name}
      </button>
    );
    render(
      <AgentChat
        messages={[
          ...messages,
          {
            id: 'a2',
            role: 'assistant',
            parts: [
              { type: 'tool-PlanWrite', toolCallId: 'plan-1', state: 'input-available', input: {} },
            ],
          },
        ]}
        status="ready"
        onSend={() => {}}
        onStop={() => {}}
        slots={{ InputBar: StubInputBar }}
        toolRenderers={{ 'tool-PlanWrite': Approve }}
        onToolAction={onToolAction}
      />
    );
    await userEvent.click(screen.getByRole('button', { name: 'approve PlanWrite' }));
    expect(onToolAction).toHaveBeenCalledWith('plan-1', 'approve', { edits: '' });
  });

  it('opens the conversation search with Mod+F from anywhere in the chat', async () => {
    render(
      <AgentChat
        messages={messages}
        status="ready"
        withSearch
        onSend={() => {}}
        onStop={() => {}}
        slots={{ InputBar: StubInputBar }}
      />
    );
    fireEvent.keyDown(screen.getByRole('button', { name: 'send' }), { key: 'f', metaKey: true });
    const input = await screen.findByRole('textbox', { name: 'Search conversation' });
    await userEvent.type(input, 'answer');
    expect(await screen.findByText('1/1')).toBeInTheDocument();
  });

  it('leaves Mod+F to the browser while the welcome screen has no conversation to search', () => {
    render(
      <AgentChat
        messages={[]}
        status="ready"
        withSearch
        emptyState={{ title: 'Hello' }}
        onSend={() => {}}
        onStop={() => {}}
        slots={{ InputBar: StubInputBar }}
      />
    );
    const notPrevented = fireEvent.keyDown(screen.getByRole('button', { name: 'send' }), {
      key: 'f',
      metaKey: true,
    });
    expect(notPrevented).toBe(true);
  });

  it('renders the empty state greeting with its suggestions above the composer', async () => {
    const SuggestionsProbe: ChatSlots['InputBar'] = ({ value, suggestions }) => (
      <div>
        <span>draft:{value}</span>
        <span>input suggestions:{Array.isArray(suggestions) ? suggestions.length : 'object'}</span>
      </div>
    );
    const { container } = render(
      <AgentChat
        messages={[]}
        status="ready"
        onSend={() => {}}
        onStop={() => {}}
        slots={{ InputBar: SuggestionsProbe }}
        emptyState={{
          layout: 'center',
          title: 'What should we work on?',
          description: 'Ask about this repository',
          suggestions: [{ id: 's1', label: 'Explain this repo', value: 'Explain the repository' }],
        }}
      />
    );
    expect(container.querySelector('[data-empty-centered]')).not.toBeNull();
    expect(screen.getByRole('heading', { name: 'What should we work on?' })).toBeInTheDocument();
    expect(screen.getByText('Ask about this repository')).toBeInTheDocument();
    await userEvent.click(screen.getByText('Explain this repo'));
    expect(screen.getByText('draft:Explain the repository')).toBeInTheDocument();
  });

  it('hides composer suggestions once the chat has messages and aligns the composer on request', () => {
    const SuggestionsProbe: ChatSlots['InputBar'] = ({ suggestions, className }) => (
      <span data-class={className}>
        input suggestions:{Array.isArray(suggestions) ? suggestions.length : 'object'}
      </span>
    );
    const items = [{ id: 's1', label: 'Explain this repo' }];
    const props = {
      status: 'ready' as const,
      onSend: () => {},
      onStop: () => {},
      slots: { InputBar: SuggestionsProbe },
      suggestions: items,
    };
    const { rerender, container } = render(
      <AgentChat {...props} messages={[]} hideSuggestionsWhenNotEmpty />
    );
    expect(screen.getByText('input suggestions:1')).toBeInTheDocument();

    rerender(
      <AgentChat {...props} messages={messages} hideSuggestionsWhenNotEmpty alignComposer />
    );
    expect(screen.getByText('input suggestions:0')).toBeInTheDocument();
    expect(container.querySelector('[data-align-composer]')).not.toBeNull();
    expect(screen.getByText('input suggestions:0')).toHaveAttribute(
      'data-class',
      expect.stringContaining('alignedInputBar')
    );

    rerender(<AgentChat {...props} messages={messages} />);
    expect(screen.getByText('input suggestions:1')).toBeInTheDocument();
    expect(container.querySelector('[data-align-composer]')).toBeNull();
  });

  it('places empty state suggestions above the composer and widens the empty state', () => {
    const { container, rerender } = render(
      <AgentChat
        messages={[]}
        status="ready"
        onSend={() => {}}
        onStop={() => {}}
        slots={{ InputBar: StubInputBar }}
        emptyState={{
          layout: 'center',
          title: 'Hi',
          suggestions: [{ id: 's1', label: 'Explain this repo' }],
        }}
      />
    );
    const root = container.querySelector<HTMLElement>('[data-empty-centered]')!;
    const composer = screen.getByText('status:ready');
    const suggestion = screen.getByText('Explain this repo');
    expect(
      composer.compareDocumentPosition(suggestion) & Node.DOCUMENT_POSITION_PRECEDING
    ).toBeTruthy();
    expect(root.style.getPropertyValue('--ae-empty-state-width')).toBe(
      'calc(37.5rem * var(--mantine-scale))'
    );

    rerender(
      <AgentChat
        messages={[]}
        status="ready"
        onSend={() => {}}
        onStop={() => {}}
        slots={{ InputBar: StubInputBar }}
        emptyStatePosition="center"
        suggestions={[{ id: 's1', label: 'Explain this repo' }]}
        emptySuggestionsPlacement="empty"
        emptySuggestionsPosition="bottom"
      />
    );
    const plainRoot = container.querySelector<HTMLElement>('[data-empty-centered]')!;
    expect(plainRoot).not.toHaveAttribute('data-empty-width');
    expect(
      screen
        .getByText('status:ready')
        .compareDocumentPosition(screen.getByText('Explain this repo')) &
        Node.DOCUMENT_POSITION_PRECEDING
    ).toBeTruthy();
  });

  describe('welcome empty state', () => {
    const DraftProbe: ChatSlots['InputBar'] = ({ value, suggestions }) => (
      <div>
        <textarea aria-label="composer" value={value} readOnly />
        <span>pills:{Array.isArray(suggestions) ? suggestions.length : 'object'}</span>
      </div>
    );

    it('keeps the composer in place, lists actions and fills the composer', async () => {
      const onSelect = jest.fn();
      const { container } = render(
        <AgentChat
          messages={[]}
          status="ready"
          onSend={() => {}}
          onStop={() => {}}
          slots={{ InputBar: DraftProbe }}
          suggestions={[{ id: 's1', label: 'Explain this repo' }]}
          emptyState={{
            avatar: 'AI',
            title: 'How can I help you today?',
            description: 'Ask about this repository',
            actions: [
              { id: 'plan', label: 'Plan a change', value: 'Plan a change to ', badge: 'New' },
              { id: 'docs', label: 'Open docs', onSelect },
            ],
          }}
        />
      );

      expect(container.querySelector('[data-empty-centered]')).toBeNull();
      expect(
        screen.getByRole('heading', { name: 'How can I help you today?' })
      ).toBeInTheDocument();
      expect(screen.getByText('New')).toBeInTheDocument();
      expect(screen.getByText('pills:0')).toBeInTheDocument();
      const composer = screen.getByRole('textbox', { name: 'composer' });

      await userEvent.click(screen.getByRole('button', { name: /Plan a change/ }));
      expect(composer).toHaveValue('Plan a change to ');
      await waitFor(() => expect(composer).toHaveFocus());

      await userEvent.click(screen.getByRole('button', { name: 'Open docs' }));
      expect(onSelect).toHaveBeenCalled();
    });

    it('hides the welcome block after the first message without remounting the composer', async () => {
      let addMessages: () => void = () => {};
      function Harness() {
        const [list, setList] = React.useState<ChatMessage[]>([]);
        addMessages = () => setList(messages);
        return (
          <AgentChat
            messages={list}
            status="ready"
            onSend={() => {}}
            onStop={() => {}}
            slots={{ InputBar: DraftProbe }}
            emptyState={{
              title: 'How can I help you today?',
              actions: [{ id: 'a', label: 'Plan' }],
            }}
          />
        );
      }
      render(<Harness />);
      const composer = screen.getByRole('textbox', { name: 'composer' });
      await userEvent.click(screen.getByRole('button', { name: 'Plan' }));
      act(() => addMessages());
      expect(screen.queryByRole('heading', { name: 'How can I help you today?' })).toBeNull();
      expect(screen.getByText('First answer')).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: 'composer' })).toBe(composer);
      expect(composer).toHaveValue('Plan');
    });

    it('moves between actions with the arrow keys and lists suggestions when there are no actions', async () => {
      render(
        <AgentChat
          messages={[]}
          status="ready"
          onSend={() => {}}
          onStop={() => {}}
          slots={{ InputBar: DraftProbe }}
          suggestions={[
            { id: 'a', label: 'Explain this repo' },
            { id: 'b', label: 'Run tests', value: 'Run the tests' },
          ]}
          emptyState={{ title: 'Hi' }}
        />
      );
      const [first, second] = screen.getAllByRole('button');
      first.focus();
      await userEvent.keyboard('{ArrowDown}');
      expect(second).toHaveFocus();
      await userEvent.keyboard('{ArrowDown}');
      expect(first).toHaveFocus();
      await userEvent.keyboard('{ArrowUp}{Enter}');
      expect(screen.getByRole('textbox', { name: 'composer' })).toHaveValue('Run the tests');
    });
  });

  describe('tool call state', () => {
    const openCalls: ChatMessage[] = [
      { id: 'u1', role: 'user', parts: [{ type: 'text', text: 'Read both files' }] },
      {
        id: 'a1',
        role: 'assistant',
        parts: [
          {
            type: 'tool-Read',
            toolCallId: 'q1',
            state: 'input-available',
            input: { file_path: '/repo/a.ts' },
          },
          {
            type: 'tool-Read',
            toolCallId: 'q2',
            state: 'input-available',
            input: { file_path: '/repo/b.ts' },
          },
          {
            type: 'tool-Bash',
            toolCallId: 'p1',
            state: 'input-available',
            input: { command: 'rm -rf build', approval: { decision: null } },
          },
        ],
      },
    ] as ChatMessage[];

    it('marks the call after the running one as queued while the answer streams', () => {
      render(
        <AgentChat
          messages={openCalls}
          status="streaming"
          onSend={() => {}}
          onStop={() => {}}
          slots={{ InputBar: StubInputBar }}
        />
      );

      expect(screen.getByText('Reading')).toBeInTheDocument();
      expect(screen.getByText('Queued')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Skip' })).toBeInTheDocument();
    });

    it('lets the lookups of the host win over the ones built from the transcript', () => {
      render(
        <AgentChat
          messages={openCalls}
          status="streaming"
          toolCallLookups={{ isAwaitingPermission: (id) => id === 'q2' }}
          onSend={() => {}}
          onStop={() => {}}
          slots={{ InputBar: StubInputBar }}
        />
      );

      expect(screen.queryByText('Queued')).toBeNull();
      expect(screen.getByText('Waiting for permission')).toBeInTheDocument();
    });
  });

  describe('appearance', () => {
    let addTurn: () => void = () => {};
    let growAnswer: (next: string) => void = () => {};

    function AppearHarness(props: { animateAppearance?: boolean }) {
      const [live, setLive] = React.useState<ChatMessage[]>([]);
      const [answer, setAnswer] = React.useState('Second answer');
      addTurn = () =>
        setLive([
          { id: 'u2', role: 'user', parts: [{ type: 'text', text: 'Second question' }] },
          { id: 'a2', role: 'assistant', parts: [{ type: 'text', text: answer }] },
        ]);
      growAnswer = (next: string) => {
        setAnswer(next);
        setLive((current) =>
          current.map((message) =>
            message.id === 'a2' ? { ...message, parts: [{ type: 'text', text: next }] } : message
          )
        );
      };
      return (
        <AgentChat
          messages={[...messages, ...live]}
          status={live.length > 0 ? 'streaming' : 'ready'}
          onSend={() => {}}
          onStop={() => {}}
          slots={{ InputBar: StubInputBar }}
          {...props}
        />
      );
    }

    function appearing(container: HTMLElement) {
      return Array.from(container.querySelectorAll('.appear'));
    }

    it('fades a new turn in by default and leaves the transcript of the first render alone', () => {
      const { container } = render(<AppearHarness />);
      expect(appearing(container)).toHaveLength(0);

      act(() => addTurn());
      expect(appearing(container).map((element) => element.textContent)).toEqual([
        'Second question',
        'Second answer',
      ]);
    });

    it('does not fade anything in under prefers-reduced-motion', () => {
      const matchMedia = window.matchMedia;
      window.matchMedia = ((query: string) => ({
        ...matchMedia(query),
        matches: query === '(prefers-reduced-motion: reduce)',
      })) as typeof window.matchMedia;

      const { container } = render(<AppearHarness />);
      act(() => addTurn());

      expect(appearing(container)).toHaveLength(0);
      window.matchMedia = matchMedia;
    });

    it('does not replay the animation while the last part grows frame by frame', () => {
      withFakeFrames((flush) => {
        const { container } = render(<AppearHarness />);
        act(() => addTurn());
        const [, answer] = appearing(container);

        act(() => growAnswer('Second answer grows'));
        flush();
        act(() => growAnswer('Second answer grows further'));
        flush();

        const stillAnimating = appearing(container);
        expect(stillAnimating).toHaveLength(2);
        expect(stillAnimating[1]).toBe(answer);
      });
    });

    it('can be turned off', () => {
      const { container } = render(<AppearHarness animateAppearance={false} />);
      act(() => addTurn());
      expect(appearing(container)).toHaveLength(0);
    });
  });

  describe('streaming', () => {
    let setText: (next: string) => void = () => {};

    function LiveHarness({ frameBatched }: { frameBatched?: boolean }) {
      const [text, setTextState] = React.useState('Answer');
      setText = setTextState;
      return (
        <AgentChat
          messages={[{ id: 'live', role: 'assistant', parts: [{ type: 'text', text }] }]}
          status="streaming"
          frameBatched={frameBatched}
          onSend={() => {}}
          onStop={() => {}}
          slots={{ InputBar: StubInputBar }}
        />
      );
    }

    it('holds the streamed answer until the next frame', () => {
      withFakeFrames((flush) => {
        render(<LiveHarness />);
        act(() => setText('Answer grows'));
        expect(screen.getByText('Answer')).toBeInTheDocument();
        flush();
        expect(screen.getByText('Answer grows')).toBeInTheDocument();
      });
    });

    it('commits the streamed answer right away with frameBatched off', () => {
      withFakeFrames(() => {
        render(<LiveHarness frameBatched={false} />);
        act(() => setText('Answer grows'));
        expect(screen.getByText('Answer grows')).toBeInTheDocument();
      });
    });
  });
});
