import React, { useState } from 'react';
import { render, screen, userEvent } from '@mantine-tests/core';
import { act, fireEvent, waitFor, within } from '@testing-library/react';
import { ChatLauncher } from './ChatLauncher';

function Composer() {
  const [value, setValue] = useState('');
  return (
    <textarea
      aria-label="Message"
      value={value}
      onChange={(event) => setValue(event.target.value)}
    />
  );
}

describe('launcher/ChatLauncher', () => {
  it('opens the panel, focuses the composer and returns focus to the button on Escape', async () => {
    const onOpenedChange = jest.fn();
    render(
      <ChatLauncher title="Assistant" onOpenedChange={onOpenedChange}>
        <Composer />
      </ChatLauncher>
    );

    const button = screen.getByRole('button', { name: 'Open chat' });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(button);

    expect(onOpenedChange).toHaveBeenLastCalledWith(true);
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(button).toHaveAttribute('tabindex', '-1');
    const dialog = screen.getByRole('dialog', { name: 'Assistant' });
    expect(button).toHaveAttribute('aria-controls', dialog.id);
    await waitFor(() => expect(screen.getByLabelText('Message')).toHaveFocus());

    await userEvent.keyboard('{Escape}');
    expect(onOpenedChange).toHaveBeenLastCalledWith(false);
    await waitFor(() => expect(button).toHaveFocus());
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  it('focuses the composer when motion is reduced', async () => {
    const matchMedia = window.matchMedia;
    window.matchMedia = ((query: string) => ({
      ...matchMedia(query),
      matches: query === '(prefers-reduced-motion: reduce)',
    })) as typeof window.matchMedia;
    render(
      <ChatLauncher title="Assistant" keepMounted={false}>
        <Composer />
      </ChatLauncher>
    );
    await userEvent.click(screen.getByRole('button', { name: 'Open chat' }));
    await waitFor(() => expect(screen.getByLabelText('Message')).toHaveFocus());
    window.matchMedia = matchMedia;
  });

  it('names the panel with the panel label when the title is not text', async () => {
    render(
      <ChatLauncher title={<span aria-hidden />} labels={{ panel: 'Support' }} defaultOpened>
        <Composer />
      </ChatLauncher>
    );
    expect(screen.getByRole('dialog', { name: 'Support' })).not.toHaveAttribute('aria-labelledby');
  });

  it('keeps the page from scrolling past the feed only while the panel is open', async () => {
    render(
      <ChatLauncher title="Assistant" keepMounted={false}>
        <div data-testid="feed" style={{ overflowY: 'auto' }} />
      </ChatLauncher>
    );
    await userEvent.click(screen.getByRole('button', { name: 'Open chat' }));
    await waitFor(() =>
      expect(screen.getByTestId('feed').style.overscrollBehaviorY).toBe('contain')
    );
    const feed = screen.getByTestId('feed');
    await userEvent.click(screen.getByRole('button', { name: 'Close chat' }));
    await waitFor(() => expect(feed.style.overscrollBehaviorY).toBe(''));
  });

  it('keeps the chat state while closed', async () => {
    render(
      <ChatLauncher>
        <Composer />
      </ChatLauncher>
    );

    await userEvent.click(screen.getByRole('button', { name: 'Open chat' }));
    await userEvent.type(screen.getByLabelText('Message'), 'draft');
    const dialog = screen.getByRole('dialog', { name: 'Chat' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Close chat' }));
    await userEvent.click(screen.getByRole('button', { name: 'Open chat' }));
    expect(screen.getByLabelText('Message')).toHaveValue('draft');
  });

  it('shows the unread badge only while closed and supports controlled state', async () => {
    const onOpenedChange = jest.fn();
    const { rerender, container } = render(
      <ChatLauncher opened={false} onOpenedChange={onOpenedChange} unreadCount={3}>
        <Composer />
      </ChatLauncher>
    );
    expect(document.body).toHaveTextContent('3');

    await userEvent.click(screen.getByRole('button', { name: 'Open chat, 3 unread' }));
    expect(onOpenedChange).toHaveBeenCalledWith(true);
    expect(screen.getByRole('button', { name: 'Open chat, 3 unread' })).toHaveAttribute(
      'aria-expanded',
      'false'
    );

    rerender(
      <ChatLauncher
        opened
        onOpenedChange={onOpenedChange}
        unreadCount={3}
        labels={{ close: 'Hide' }}
      >
        <Composer />
      </ChatLauncher>
    );
    expect(screen.getAllByRole('button', { name: 'Hide' }).length).toBeGreaterThan(0);
    expect(container.ownerDocument.body.querySelector('.mantine-Indicator-indicator')).toBeNull();
  });

  it('does not steal focus when it starts open', () => {
    render(
      <ChatLauncher defaultOpened>
        <Composer />
      </ChatLauncher>
    );
    expect(screen.getByLabelText('Message')).not.toHaveFocus();
  });

  it('switches to full screen on a narrow window without remounting the chat', async () => {
    const setWidth = (width: number) => {
      Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
      act(() => {
        fireEvent(window, new Event('resize'));
      });
    };
    const initialWidth = window.innerWidth;
    render(
      <ChatLauncher title="Assistant">
        <Composer />
      </ChatLauncher>
    );
    await userEvent.click(screen.getByRole('button', { name: 'Open chat' }));
    await userEvent.type(screen.getByLabelText('Message'), 'draft');
    const composer = screen.getByLabelText('Message');
    const root = screen.getByRole('dialog', { name: 'Assistant' }).parentElement!;
    expect(root).toHaveAttribute('data-mode', 'compact');
    expect(document.documentElement.style.overflow).toBe('');

    const button = screen.getByRole('button', { name: 'Open chat', expanded: true });

    setWidth(390);
    expect(root).toHaveAttribute('data-mode', 'fullscreen');
    expect(button).toHaveAttribute('tabindex', '-1');
    expect(document.documentElement.style.overflow).toBe('hidden');

    setWidth(initialWidth);
    expect(root).toHaveAttribute('data-mode', 'compact');
    expect(document.documentElement.style.overflow).toBe('');
    expect(screen.getByLabelText('Message')).toBe(composer);
    expect(composer).toHaveValue('draft');
    expect(composer).toHaveFocus();
  });

  it('keeps a static panel height whatever the content', () => {
    const heightFor = (lines: number) => {
      const { unmount } = render(
        <ChatLauncher title="Assistant" defaultOpened>
          {Array.from({ length: lines }, (_, index) => (
            <p key={index}>Line {index}</p>
          ))}
        </ChatLauncher>
      );
      const root = screen.getByRole('dialog', { name: 'Assistant' }).parentElement!;
      const height = root.style.getPropertyValue('--launcher-panel-height');
      unmount();
      return height;
    };
    expect(heightFor(0)).toBe('640px');
    expect(heightFor(80)).toBe('640px');
  });

  it('does not freeze the page scroll without a portal', () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 390 });
    const { unmount } = render(
      <ChatLauncher title="Assistant" defaultOpened withinPortal={false}>
        <Composer />
      </ChatLauncher>
    );
    expect(screen.getByRole('dialog').parentElement).toHaveAttribute('data-mode', 'fullscreen');
    expect(document.documentElement.style.overflow).toBe('');
    unmount();
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1024 });
  });
});
