import React from 'react';
import { fireEvent } from '@testing-library/react';
import { render, screen, userEvent } from '@mantine-tests/core';
import type { QuestionConfig } from '../question/QuestionPrompt';
import { InputBar } from './InputBar';

describe('input/InputBar', () => {
  beforeAll(() => {
    Element.prototype.scrollIntoView = jest.fn();
  });

  it('sends trimmed content on Enter and clears the field', async () => {
    const onSend = jest.fn();
    render(<InputBar status="ready" onSend={onSend} onStop={() => {}} />);

    const textarea = screen.getByPlaceholderText('Send a message...');
    await userEvent.type(textarea, '  hello world  {Enter}');

    expect(onSend).toHaveBeenCalledTimes(1);
    expect(onSend).toHaveBeenCalledWith({ role: 'user', content: 'hello world' });
    expect(textarea).toHaveValue('');
  });

  it('does not send empty or whitespace-only content', async () => {
    const onSend = jest.fn();
    render(<InputBar status="ready" onSend={onSend} onStop={() => {}} />);

    const textarea = screen.getByPlaceholderText('Send a message...');
    await userEvent.type(textarea, '   {Enter}');

    expect(onSend).not.toHaveBeenCalled();
  });

  it('inserts a newline on Shift+Enter instead of sending', async () => {
    const onSend = jest.fn();
    render(<InputBar status="ready" onSend={onSend} onStop={() => {}} />);

    const textarea = screen.getByPlaceholderText('Send a message...');
    await userEvent.type(textarea, 'line{Shift>}{Enter}{/Shift}two');

    expect(onSend).not.toHaveBeenCalled();
    expect(textarea).toHaveValue('line\ntwo');
  });

  it('calls onStop instead of sending while streaming', async () => {
    const onSend = jest.fn();
    const onStop = jest.fn();
    render(
      <InputBar
        status="streaming"
        onSend={onSend}
        onStop={onStop}
        value="draft"
        onChange={() => {}}
      />
    );

    await userEvent.keyboard('{Enter}');
    expect(onSend).not.toHaveBeenCalled();
  });

  it('renders the attach button only when onAttach is provided', () => {
    const { rerender } = render(<InputBar status="ready" onSend={() => {}} onStop={() => {}} />);
    expect(screen.queryByLabelText('Attach')).toBeNull();

    rerender(<InputBar status="ready" onSend={() => {}} onStop={() => {}} onAttach={() => {}} />);
    expect(screen.getByLabelText('Attach')).toBeInTheDocument();
  });

  it('does not send while an IME composition is active', () => {
    const onSend = jest.fn();
    render(
      <InputBar
        status="ready"
        onSend={onSend}
        onStop={() => {}}
        value="konnichiwa"
        onChange={() => {}}
      />
    );

    const textarea = screen.getByPlaceholderText('Send a message...');
    fireEvent.keyDown(textarea, { key: 'Enter', keyCode: 229, isComposing: true });

    expect(onSend).not.toHaveBeenCalled();
  });

  it('clears a controlled value through onChange after sending', async () => {
    const onChange = jest.fn();
    const onSend = jest.fn();
    render(
      <InputBar
        status="ready"
        onSend={onSend}
        onStop={() => {}}
        value="hello"
        onChange={onChange}
      />
    );

    await userEvent.type(screen.getByPlaceholderText('Send a message...'), '{Enter}');

    expect(onSend).toHaveBeenCalledWith({ role: 'user', content: 'hello' });
    expect(onChange).toHaveBeenLastCalledWith('');
  });

  describe('questionBar', () => {
    const questions: QuestionConfig[] = [
      { kind: 'single', title: 'First question', options: [{ id: 'a', label: 'Alpha' }] },
      { kind: 'single', title: 'Second question', options: [{ id: 'b', label: 'Beta' }] },
    ];

    it('answers every question in order and closes after the last one', async () => {
      const onSubmit = jest.fn();
      render(
        <InputBar
          status="ready"
          onSend={() => {}}
          onStop={() => {}}
          questionBar={{ id: 'q1', questions, onSubmit, submitLabel: 'Submit' }}
        />
      );

      await userEvent.click(screen.getByRole('button', { name: /Alpha/ }));
      await userEvent.click(screen.getByRole('button', { name: 'Next' }));
      expect(onSubmit).toHaveBeenLastCalledWith(
        { kind: 'single', selectedIds: ['a'], text: undefined },
        { questionIndex: 1 }
      );
      expect(screen.getByText('Second question')).toBeInTheDocument();

      await userEvent.click(screen.getByRole('button', { name: /Beta/ }));
      await userEvent.click(screen.getByRole('button', { name: 'Submit' }));
      expect(onSubmit).toHaveBeenLastCalledWith(
        { kind: 'single', selectedIds: ['b'], text: undefined },
        { questionIndex: 2 }
      );
      expect(screen.queryByText('Second question')).toBeNull();
    });

    it('reports skip once through onSkip', async () => {
      const onSubmit = jest.fn();
      const onSkip = jest.fn();
      render(
        <InputBar
          status="ready"
          onSend={() => {}}
          onStop={() => {}}
          questionBar={{ id: 'q1', questions, onSubmit, onSkip }}
        />
      );

      await userEvent.click(screen.getByRole('button', { name: 'Skip' }));

      expect(onSkip).toHaveBeenCalledTimes(1);
      expect(onSkip).toHaveBeenCalledWith({ questionIndex: 1 });
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('starts a new question set from the first question', async () => {
      const props = { status: 'ready' as const, onSend: () => {}, onStop: () => {} };
      const { rerender } = render(
        <InputBar {...props} questionBar={{ id: 'q1', questions, onSubmit: () => {} }} />
      );
      await userEvent.click(screen.getByRole('button', { name: /Alpha/ }));
      await userEvent.click(screen.getByRole('button', { name: 'Next' }));
      expect(screen.getByText('Second question')).toBeInTheDocument();

      rerender(<InputBar {...props} questionBar={{ id: 'q2', questions, onSubmit: () => {} }} />);
      expect(screen.getByText('First question')).toBeInTheDocument();
    });
  });
  describe('completions', () => {
    const commands = [
      { value: 'review', label: '/review', description: 'Review the diff' },
      { value: 'compact', label: '/compact', description: 'Summarize history' },
    ];

    it('opens on a slash at the start and inserts the chosen command on Enter', async () => {
      const onSend = jest.fn();
      const onSelect = jest.fn();
      render(
        <InputBar
          status="ready"
          onSend={onSend}
          onStop={() => {}}
          completions={[{ trigger: '/', items: commands, onSelect }]}
        />
      );

      const textarea = screen.getByPlaceholderText('Send a message...');
      await userEvent.type(textarea, '/com');

      expect(await screen.findByText('Summarize history')).toBeInTheDocument();
      expect(screen.queryByText('Review the diff')).toBeNull();

      await userEvent.keyboard('{Enter}');

      expect(onSend).not.toHaveBeenCalled();
      expect(textarea).toHaveValue('/compact ');
      expect(onSelect).toHaveBeenCalledWith(commands[1]);
    });

    it('moves the selection with arrow keys and inserts on Tab', async () => {
      render(
        <InputBar
          status="ready"
          onSend={() => {}}
          onStop={() => {}}
          completions={[{ trigger: '/', items: commands }]}
        />
      );

      const textarea = screen.getByPlaceholderText('Send a message...');
      await userEvent.type(textarea, '/');
      await screen.findByText('Review the diff');
      await userEvent.keyboard('{ArrowDown}{Tab}');

      expect(textarea).toHaveValue('/compact ');
    });

    it('closes on Escape and lets Enter send again', async () => {
      const onSend = jest.fn();
      render(
        <InputBar
          status="ready"
          onSend={onSend}
          onStop={() => {}}
          completions={[{ trigger: '/', items: commands }]}
        />
      );

      const textarea = screen.getByPlaceholderText('Send a message...');
      await userEvent.type(textarea, '/rev');
      await screen.findByText('Review the diff');
      await userEvent.keyboard('{Escape}');
      expect(textarea).toHaveAttribute('aria-expanded', 'false');

      await userEvent.keyboard('{Enter}');
      expect(onSend).toHaveBeenCalledWith({ role: 'user', content: '/rev' });
    });

    it('does not open a slash list in the middle of a line', async () => {
      render(
        <InputBar
          status="ready"
          onSend={() => {}}
          onStop={() => {}}
          completions={[{ trigger: '/', items: commands }]}
        />
      );

      await userEvent.type(screen.getByPlaceholderText('Send a message...'), 'see /rev');
      expect(screen.queryByText('Review the diff')).toBeNull();
    });

    it('resolves mention items asynchronously', async () => {
      const resolve = jest.fn((query: string) =>
        Promise.resolve(
          [
            { value: 'alice', label: 'Alice' },
            { value: 'bob', label: 'Bob' },
          ].filter((item) => item.value.startsWith(query))
        )
      );
      render(
        <InputBar
          status="ready"
          onSend={() => {}}
          onStop={() => {}}
          completions={[{ trigger: '@', items: resolve }]}
        />
      );

      const textarea = screen.getByPlaceholderText('Send a message...');
      await userEvent.type(textarea, 'ask @b');

      expect(await screen.findByText('Bob')).toBeInTheDocument();
      expect(screen.queryByText('Alice')).toBeNull();
      expect(resolve).toHaveBeenLastCalledWith('b');

      await userEvent.keyboard('{Enter}');
      expect(textarea).toHaveValue('ask @bob ');
    });
  });

  describe('queue', () => {
    it('queues a message while streaming when onQueue is set', async () => {
      const onSend = jest.fn();
      const onQueue = jest.fn();
      render(<InputBar status="streaming" onSend={onSend} onStop={() => {}} onQueue={onQueue} />);

      const textarea = screen.getByPlaceholderText('Send a message...');
      await userEvent.type(textarea, 'next step{Enter}');

      expect(onSend).not.toHaveBeenCalled();
      expect(onQueue).toHaveBeenCalledWith({ role: 'user', content: 'next step' });
      expect(textarea).toHaveValue('');
      expect(screen.getByLabelText('Stop')).toBeInTheDocument();
    });

    it('keeps the draft while streaming without onQueue', async () => {
      render(<InputBar status="streaming" onSend={() => {}} onStop={() => {}} />);

      const textarea = screen.getByPlaceholderText('Send a message...');
      await userEvent.type(textarea, 'draft{Enter}');

      expect(textarea).toHaveValue('draft');
    });

    it('renders queued messages and removes them', async () => {
      const onRemoveQueued = jest.fn();
      render(
        <InputBar
          status="streaming"
          onSend={() => {}}
          onStop={() => {}}
          queuedMessages={[
            { id: 'q1', content: 'Run the tests' },
            { id: 'q2', content: 'Then open a PR' },
          ]}
          onRemoveQueued={onRemoveQueued}
        />
      );

      expect(screen.getByText('Queued')).toBeInTheDocument();
      expect(screen.getByText('Then open a PR')).toBeInTheDocument();

      await userEvent.click(screen.getAllByLabelText('Remove queued message')[0]);
      expect(onRemoveQueued).toHaveBeenCalledWith('q1');
    });
  });

  it('renders suggestion pills above the field', () => {
    render(
      <InputBar
        status="ready"
        onSend={() => {}}
        onStop={() => {}}
        suggestions={[{ id: 's1', label: 'Explain this repo' }]}
      />
    );
    const pill = screen.getByText('Explain this repo');
    const field = screen.getByPlaceholderText('Send a message...');
    expect(pill.compareDocumentPosition(field) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
