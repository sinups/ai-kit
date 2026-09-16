import React from 'react';
import { render, screen, userEvent } from '@mantine-tests/core';
import { InputBar } from './InputBar';

describe('InputBar', () => {
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
});
