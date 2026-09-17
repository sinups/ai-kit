import React, { useState } from 'react';
import { render, screen, userEvent } from '@mantine-tests/core';
import { waitFor } from '@testing-library/react';
import { type CompletionSource } from './use-completion-items';
import { InputBar, type InputBarProps } from './InputBar';

const LONG_PASTE = Array.from({ length: 60 }, (_, index) => `line ${index + 1}`).join('\n');

function renderBar(props: Partial<InputBarProps> = {}) {
  const onSend = jest.fn();
  const user = userEvent.setup({ delay: null });
  render(<InputBar status="ready" onSend={onSend} onStop={() => {}} {...props} />);
  const textarea = screen.getByPlaceholderText('Send a message...') as HTMLTextAreaElement;
  return { onSend, user, textarea };
}

describe('input/InputBar paste collapsing', () => {
  beforeAll(() => {
    Element.prototype.scrollIntoView = jest.fn();
  });

  it('collapses a large paste into a pill and expands it on send', async () => {
    const { onSend, user, textarea } = renderBar();

    await user.click(textarea);
    await user.paste('Explain this log: ');
    await user.paste(LONG_PASTE);
    expect(textarea).toHaveValue('Explain this log: [Pasted text #1]');
    expect(screen.getByText('Pasted text #1')).toBeInTheDocument();
    expect(screen.getByText('60 lines')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Pasted text #1/ }));
    expect(await screen.findByRole('dialog', { name: 'Pasted text #1' })).toHaveTextContent(
      'line 60'
    );
    await user.keyboard('{Escape}');

    await user.click(textarea);
    await user.keyboard('{Enter}');
    expect(onSend).toHaveBeenCalledWith({
      role: 'user',
      content: `Explain this log: ${LONG_PASTE}`,
    });
    expect(screen.queryByText(/Pasted text #/)).not.toBeInTheDocument();
  });

  it('removes a collapsed paste and keeps small pastes inline', async () => {
    const { user, textarea } = renderBar({ pasteCollapseThreshold: { lines: 3 } });

    await user.click(textarea);
    await user.paste('a\nb\nc');
    await user.paste(' tail');
    expect(textarea).toHaveValue('[Pasted text #1] tail');

    await user.click(screen.getByRole('button', { name: 'Remove pasted text' }));
    expect(textarea).toHaveValue(' tail');
    expect(screen.queryByText(/Pasted text #1/)).not.toBeInTheDocument();
  });

  it('drops the pill when the placeholder is deleted', async () => {
    const { user, textarea } = renderBar({ pasteCollapseThreshold: { lines: 2 } });
    await user.click(textarea);
    await user.paste('a\nb');
    expect(screen.getByText('2 lines')).toBeInTheDocument();
    await user.clear(textarea);
    expect(screen.queryByText(/Pasted text #1/)).not.toBeInTheDocument();
  });

  it('keeps large pastes inline when collapsing is off', async () => {
    const { user, textarea } = renderBar({ pasteCollapseThreshold: false });
    await user.click(textarea);
    await user.paste(LONG_PASTE);
    expect(textarea).toHaveValue(LONG_PASTE);
  });
});

describe('input/InputBar prompt history', () => {
  beforeAll(() => {
    Element.prototype.scrollIntoView = jest.fn();
  });

  const HISTORY = ['first prompt', 'second prompt'];

  it('browses history with arrows and restores the draft', async () => {
    const { user, textarea } = renderBar({ history: HISTORY });

    await user.click(textarea);
    await user.keyboard('{ArrowUp}');
    expect(textarea).toHaveValue('second prompt');
    textarea.setSelectionRange(0, 0);
    await user.keyboard('{ArrowUp}');
    expect(textarea).toHaveValue('first prompt');

    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
    await user.keyboard('{ArrowDown}');
    expect(textarea).toHaveValue('second prompt');
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
    await user.keyboard('{ArrowDown}');
    expect(textarea).toHaveValue('');
  });

  it('keeps the draft typed before browsing and ignores arrows mid-text', async () => {
    const { user, textarea } = renderBar({ history: HISTORY });

    await user.click(textarea);
    await user.type(textarea, 'draft');
    await user.keyboard('{ArrowUp}');
    expect(textarea).toHaveValue('draft');

    textarea.setSelectionRange(0, 0);
    await user.keyboard('{ArrowUp}');
    expect(textarea).toHaveValue('second prompt');
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
    await user.keyboard('{ArrowDown}');
    expect(textarea).toHaveValue('draft');
  });

  it('leaves arrows to the completion list while it is open', async () => {
    const completions: CompletionSource[] = [
      {
        trigger: '/',
        items: [
          { value: '/help', label: '/help' },
          { value: '/clear', label: '/clear' },
        ],
      },
    ];
    const { user, textarea } = renderBar({ history: HISTORY, completions });

    await user.click(textarea);
    await user.type(textarea, '/');
    await user.keyboard('{ArrowUp}');
    expect(textarea).toHaveValue('/');
  });

  it('opens the prompt history search with mod+R and picks a prompt', async () => {
    const { user, textarea } = renderBar({ history: HISTORY });

    await user.click(textarea);
    await user.keyboard('{Control>}r{/Control}');
    const search = await screen.findByRole('combobox', { name: 'Find a previous prompt' });
    await user.type(search, 'first');
    await user.keyboard('{Enter}');

    await waitFor(() => expect(textarea).toHaveValue('first prompt'));
  });

  it('calls onHistorySearch instead of the built-in dialog', async () => {
    const onHistorySearch = jest.fn();
    const { user, textarea } = renderBar({ history: HISTORY, onHistorySearch });

    await user.click(textarea);
    await user.keyboard('{Control>}r{/Control}');
    expect(onHistorySearch).toHaveBeenCalledTimes(1);
    expect(
      screen.queryByRole('combobox', { name: 'Find a previous prompt' })
    ).not.toBeInTheDocument();
  });
});

function Controlled() {
  const [value, setValue] = useState('');
  return (
    <InputBar
      status="ready"
      onSend={() => setValue('')}
      onStop={() => {}}
      value={value}
      onChange={setValue}
      history={['from history']}
    />
  );
}

describe('input/InputBar controlled history', () => {
  it('works with a controlled value', async () => {
    const user = userEvent.setup({ delay: null });
    render(<Controlled />);
    const textarea = screen.getByPlaceholderText('Send a message...');
    await user.click(textarea);
    await user.keyboard('{ArrowUp}');
    expect(textarea).toHaveValue('from history');
  });
});
