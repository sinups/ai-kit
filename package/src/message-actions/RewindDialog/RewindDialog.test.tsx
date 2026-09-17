import React from 'react';
import { render, screen, userEvent } from '@mantine-tests/core';
import { waitFor } from '@testing-library/react';
import type { ChatMessage } from '../../types';
import { RewindDialog } from './RewindDialog';

const messages: ChatMessage[] = [
  { id: 'u1', role: 'user', parts: [{ type: 'text', text: 'Add a login form' }] },
  { id: 'a1', role: 'assistant', parts: [{ type: 'text', text: 'Done' }] },
  { id: 'u2', role: 'user', parts: [{ type: 'text', text: 'Now add tests' }] },
  { id: 'a2', role: 'assistant', parts: [{ type: 'text', text: 'Added' }] },
];

describe('message-actions/RewindDialog', () => {
  it('rewinds to the picked point with the chosen mode and closes', async () => {
    const onRewind = jest.fn();
    const onClose = jest.fn();
    render(<RewindDialog opened onClose={onClose} messages={messages} onRewind={onRewind} />);

    const options = await screen.findAllByRole('option');
    expect(options).toHaveLength(2);
    expect(options[0]).toHaveTextContent('Now add tests');
    expect(options[0]).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('3 later messages')).toBeInTheDocument();

    await userEvent.click(options[1]);
    await userEvent.click(screen.getByRole('radio', { name: /Messages and file changes/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Rewind' }));

    expect(onRewind).toHaveBeenCalledWith({ messageId: 'u1', mode: 'conversation-and-code' });
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it('keeps the dialog open and shows the error when rewinding fails', async () => {
    const onRewind = jest.fn().mockRejectedValue(new Error('Checkpoint missing'));
    const onClose = jest.fn();
    render(
      <RewindDialog
        opened
        onClose={onClose}
        messages={messages}
        onRewind={onRewind}
        defaultMessageId="u1"
        modes={['conversation']}
      />
    );

    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
    await userEvent.click(await screen.findByRole('button', { name: 'Rewind' }));
    expect(onRewind).toHaveBeenCalledWith({ messageId: 'u1', mode: 'conversation' });
    expect(await screen.findByText('Checkpoint missing')).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });
  it('summarizes from or up to the selected point with the optional context', async () => {
    let resolve: () => void = () => {};
    const onSummarize = jest.fn(() => new Promise<void>((done) => (resolve = done)));
    const onClose = jest.fn();
    render(
      <RewindDialog
        opened
        onClose={onClose}
        messages={messages}
        onRewind={jest.fn()}
        onSummarize={onSummarize}
        defaultMessageId="u1"
      />
    );

    await userEvent.type(
      await screen.findByRole('textbox', { name: 'What should the summary keep?' }),
      '  keep the form fields  '
    );
    await userEvent.click(screen.getByRole('button', { name: 'Summarize everything above' }));
    expect(onSummarize).toHaveBeenCalledWith({
      messageId: 'u1',
      direction: 'up-to',
      context: 'keep the form fields',
    });
    expect(screen.getByRole('button', { name: 'Summarize everything above' })).toHaveAttribute(
      'data-loading',
      'true'
    );
    expect(screen.getByRole('button', { name: 'Summarize this and below' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Rewind' })).toBeDisabled();

    resolve();
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  it('omits empty context and shows a summarize failure', async () => {
    const onSummarize = jest.fn(() => Promise.reject(new Error('Summary model unavailable')));
    const onClose = jest.fn();
    render(
      <RewindDialog
        opened
        onClose={onClose}
        messages={messages}
        onRewind={jest.fn()}
        onSummarize={onSummarize}
      />
    );

    await userEvent.click(await screen.findByRole('button', { name: 'Summarize this and below' }));
    expect(onSummarize).toHaveBeenCalledWith({ messageId: 'u2', direction: 'from' });
    expect(await screen.findByText('Summary model unavailable')).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('hides the summarize actions without onSummarize', async () => {
    render(<RewindDialog opened onClose={jest.fn()} messages={messages} onRewind={jest.fn()} />);
    await screen.findByRole('button', { name: 'Rewind' });
    expect(
      screen.queryByRole('button', { name: 'Summarize this and below' })
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: 'What should the summary keep?' })).toBeNull();
  });
});
