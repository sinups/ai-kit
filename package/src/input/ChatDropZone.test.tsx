import React from 'react';
import { render, screen } from '@mantine-tests/core';
import { fireEvent } from '@testing-library/react';
import { ChatDropZone, DEFAULT_CHAT_DROP_ZONE_LABELS } from './ChatDropZone';

const png = new File(['x'], 'shot.png', { type: 'image/png' });
const pdf = new File(['x'], 'spec.pdf', { type: 'application/pdf' });

function files(...items: File[]) {
  return { dataTransfer: { types: ['Files'], files: items, dropEffect: 'none' } };
}

function renderZone(props: Partial<React.ComponentProps<typeof ChatDropZone>> = {}) {
  const onFiles = jest.fn();
  const view = render(
    <ChatDropZone onFiles={onFiles} {...props}>
      {({ isDragOver }) => (
        <div data-testid="chat" data-over={isDragOver}>
          <p data-testid="child">Transcript</p>
        </div>
      )}
    </ChatDropZone>
  );
  return { ...view, onFiles };
}

describe('input/ChatDropZone', () => {
  it('stays over while the pointer moves between children and takes the drop', () => {
    const { onFiles } = renderZone();
    const chat = screen.getByTestId('chat');
    const child = screen.getByTestId('child');

    fireEvent.dragEnter(chat, files(png));
    fireEvent.dragEnter(child, files(png));
    fireEvent.dragLeave(chat, files(png));
    expect(chat).toHaveAttribute('data-over', 'true');
    expect(screen.getByText('Drop files to attach', { selector: 'p' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Drop files to attach');

    fireEvent.drop(child, files(png));
    expect(onFiles).toHaveBeenCalledWith([png]);
    expect(chat).toHaveAttribute('data-over', 'false');
  });

  it('ignores dragged text and leaves when the last element is left', () => {
    renderZone();
    const chat = screen.getByTestId('chat');
    fireEvent.dragEnter(chat, { dataTransfer: { types: ['text/plain'], files: [] } });
    expect(chat).toHaveAttribute('data-over', 'false');

    fireEvent.dragEnter(chat, files(png));
    fireEvent.dragLeave(chat, files(png));
    expect(chat).toHaveAttribute('data-over', 'false');
  });

  it('filters by the policy and reports the rest', () => {
    const onReject = jest.fn();
    const { onFiles } = renderZone({ policy: { accept: ['image/*'] }, onReject });
    fireEvent.drop(screen.getByTestId('chat'), files(png, pdf));
    expect(onFiles).toHaveBeenCalledWith([png]);
    expect(onReject).toHaveBeenCalledWith([{ file: pdf, reason: 'type' }]);
  });

  it('does nothing when disabled and keeps the English default', () => {
    expect(DEFAULT_CHAT_DROP_ZONE_LABELS.drop).toBe('Drop files to attach');
    const { onFiles } = renderZone({ disabled: true });
    const chat = screen.getByTestId('chat');
    fireEvent.dragEnter(chat, files(png));
    fireEvent.drop(chat, files(png));
    expect(chat).toHaveAttribute('data-over', 'false');
    expect(onFiles).not.toHaveBeenCalled();
  });
});

describe('input/ChatDropZone reset', () => {
  it('drops the overlay when it gets disabled mid-drag', () => {
    const onFiles = jest.fn();
    const view = (disabled: boolean) => (
      <ChatDropZone onFiles={onFiles} disabled={disabled}>
        {({ isDragOver }) => <div data-testid="chat" data-over={isDragOver} />}
      </ChatDropZone>
    );
    const { rerender } = render(view(false));
    fireEvent.dragEnter(screen.getByTestId('chat'), files(png));
    expect(screen.getByTestId('chat')).toHaveAttribute('data-over', 'true');

    rerender(view(true));
    expect(screen.getByTestId('chat')).toHaveAttribute('data-over', 'false');
    rerender(view(false));
    fireEvent.dragEnter(screen.getByTestId('chat'), files(png));
    fireEvent.dragLeave(screen.getByTestId('chat'), files(png));
    expect(screen.getByTestId('chat')).toHaveAttribute('data-over', 'false');
  });

  it('drops the overlay when a child swallows the drop', () => {
    const onFiles = jest.fn();
    render(
      <ChatDropZone onFiles={onFiles}>
        {({ isDragOver }) => (
          <div data-testid="chat" data-over={isDragOver}>
            <div data-testid="own-zone" onDrop={(event) => event.stopPropagation()} />
          </div>
        )}
      </ChatDropZone>
    );
    fireEvent.dragEnter(screen.getByTestId('chat'), files(png));
    fireEvent.drop(screen.getByTestId('own-zone'), files(png));
    expect(onFiles).not.toHaveBeenCalled();
    expect(screen.getByTestId('chat')).toHaveAttribute('data-over', 'false');
  });
});
