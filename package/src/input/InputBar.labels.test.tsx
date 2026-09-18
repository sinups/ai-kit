import React from 'react';
import { render, screen, userEvent } from '@mantine-tests/core';
import { AgentChat } from '../AgentChat/AgentChat';
import { DEFAULT_INPUT_BAR_LABELS, InputBar } from './InputBar';

const noop = () => {};

describe('input/InputBar labels', () => {
  it('keeps the English defaults', () => {
    expect(DEFAULT_INPUT_BAR_LABELS).toMatchObject({
      send: 'Send',
      stop: 'Stop',
      closeInfoBar: 'Close',
    });
    render(<InputBar status="ready" onSend={noop} onStop={noop} onAttach={noop} />);
    expect(screen.getByRole('button', { name: 'Send' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Attach' })).toBeInTheDocument();
  });

  it('labels the send, stop, attach and remove buttons', () => {
    const labels = {
      send: 'Отправить',
      stop: 'Остановить',
      attach: { attach: 'Прикрепить' },
      attachment: { remove: 'Убрать вложение' },
    };
    const { rerender } = render(
      <InputBar
        status="ready"
        onSend={noop}
        onStop={noop}
        onAttach={noop}
        attachedFiles={[{ id: 'f1', filename: 'report.pdf', size: 1200 }]}
        onRemoveFile={noop}
        labels={labels}
      />
    );
    expect(screen.getByRole('button', { name: 'Отправить' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Прикрепить' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Убрать вложение' })).toBeInTheDocument();

    rerender(<InputBar status="streaming" onSend={noop} onStop={noop} labels={labels} />);
    expect(screen.getByRole('button', { name: 'Остановить' })).toBeInTheDocument();
  });

  it('labels the close button of the info bar', () => {
    render(
      <InputBar
        status="ready"
        onSend={noop}
        onStop={noop}
        infoBar={{ title: 'Сессия скоро закончится', onClose: noop }}
        labels={{ closeInfoBar: 'Закрыть' }}
      />
    );
    expect(screen.getByRole('button', { name: 'Закрыть' })).toBeInTheDocument();
  });
});

describe('input/InputBar uploads', () => {
  const uploading = [
    { id: 'f1', filename: 'report.pdf', status: 'uploading' as const, progress: 30 },
  ];

  it('keeps Send off while a file uploads and routes cancel and retry by id', async () => {
    const user = userEvent.setup({ delay: null });
    const onSend = jest.fn();
    const onCancelFile = jest.fn();
    const onRetryFile = jest.fn();
    const { rerender } = render(
      <InputBar
        status="ready"
        onSend={onSend}
        onStop={noop}
        value="Summarize it"
        attachedFiles={uploading}
        onCancelFile={onCancelFile}
        onRetryFile={onRetryFile}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Wait for uploads to finish' }));
    await user.type(screen.getByRole('textbox'), '{Enter}');
    expect(onSend).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Cancel upload' }));
    expect(onCancelFile).toHaveBeenCalledWith('f1');

    rerender(
      <InputBar
        status="ready"
        onSend={onSend}
        onStop={noop}
        value="Summarize it"
        attachedFiles={[{ id: 'f1', filename: 'report.pdf', status: 'error' }]}
        onCancelFile={onCancelFile}
        onRetryFile={onRetryFile}
      />
    );
    await user.click(screen.getByRole('button', { name: 'Retry upload' }));
    expect(onRetryFile).toHaveBeenCalledWith('f1');
    await user.click(screen.getByRole('button', { name: 'Send' }));
    expect(onSend).toHaveBeenCalledWith({ role: 'user', content: 'Summarize it' });
  });

  it('lets the host send during uploads when it opts out', async () => {
    const user = userEvent.setup({ delay: null });
    const onSend = jest.fn();
    render(
      <InputBar
        status="ready"
        onSend={onSend}
        onStop={noop}
        value="Go"
        attachedFiles={uploading}
        blockSendWhileUploading={false}
      />
    );
    await user.click(screen.getByRole('button', { name: 'Send' }));
    expect(onSend).toHaveBeenCalled();
  });
});

describe('AgentChat attachments uploads', () => {
  it('passes cancel, retry and the send block through to the composer', async () => {
    const user = userEvent.setup({ delay: null });
    const onCancelFile = jest.fn();
    const onRetryFile = jest.fn();
    render(
      <AgentChat
        messages={[]}
        status="ready"
        onSend={noop}
        onStop={noop}
        attachments={{
          files: [
            { id: 'a', filename: 'a.pdf', status: 'uploading', progress: 10 },
            { id: 'b', filename: 'b.pdf', status: 'error' },
          ],
          onCancelFile,
          onRetryFile,
        }}
      />
    );
    expect(screen.getByRole('button', { name: 'Wait for uploads to finish' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Cancel upload' }));
    await user.click(screen.getByRole('button', { name: 'Retry upload' }));
    expect(onCancelFile).toHaveBeenCalledWith('a');
    expect(onRetryFile).toHaveBeenCalledWith('b');
  });
});
