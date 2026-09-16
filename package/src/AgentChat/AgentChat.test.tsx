import React from 'react';
import { render, screen, userEvent } from '@mantine-tests/core';
import type { ChatMessage, ChatSlots } from '../types';
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

describe('AgentChat', () => {
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
});
