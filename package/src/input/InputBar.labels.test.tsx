import React from 'react';
import { render, screen } from '@mantine-tests/core';
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
