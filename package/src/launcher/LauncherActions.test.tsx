import React, { useState } from 'react';
import { render, screen, userEvent } from '@mantine-tests/core';
import { waitFor } from '@testing-library/react';
import { ChatLauncher } from './ChatLauncher';
import type { LauncherAction } from './LauncherActions';

function actions(overrides: Partial<LauncherAction>[] = []): LauncherAction[] {
  const base: LauncherAction[] = [
    { id: 'chat', label: 'Chat with us', icon: <span />, opensChat: true },
    { id: 'call', label: 'Request a call', icon: <span /> },
    { id: 'mail', label: 'Write an email', icon: <span />, href: 'mailto:hi@example.com' },
  ];
  return base.map((action, index) => ({ ...action, ...overrides[index] }));
}

describe('launcher/LauncherActions', () => {
  it('fans the actions out of the button and back', async () => {
    render(
      <ChatLauncher title="Assistant" actions={actions()}>
        <div />
      </ChatLauncher>
    );

    const button = screen.getByRole('button', { name: 'Show ways to get in touch' });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByRole('button', { name: 'Request a call', hidden: true })).toHaveAttribute(
      'tabindex',
      '-1'
    );

    await userEvent.click(button);

    const opened = screen.getByRole('button', { name: 'Hide ways to get in touch' });
    expect(opened).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: 'Request a call' })).not.toHaveAttribute(
      'tabindex',
      '-1'
    );

    await userEvent.click(opened);
    expect(screen.getByRole('button', { name: 'Show ways to get in touch' })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
  });

  it('calls the action and opens the chat only when the action asks for it', async () => {
    const onClick = jest.fn();
    const onOpenedChange = jest.fn();
    render(
      <ChatLauncher
        title="Assistant"
        onOpenedChange={onOpenedChange}
        actions={actions([{}, { onClick }])}
      >
        <div />
      </ChatLauncher>
    );

    await userEvent.click(screen.getByRole('button', { name: 'Show ways to get in touch' }));
    await userEvent.click(screen.getByRole('button', { name: 'Request a call' }));

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onOpenedChange).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Show ways to get in touch' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Show ways to get in touch' }));
    await userEvent.click(screen.getByRole('button', { name: 'Chat with us' }));

    expect(onOpenedChange).toHaveBeenLastCalledWith(true);
  });

  it('renders an action with a link as a link', async () => {
    render(
      <ChatLauncher title="Assistant" actions={actions()}>
        <div />
      </ChatLauncher>
    );

    await userEvent.click(screen.getByRole('button', { name: 'Show ways to get in touch' }));
    expect(screen.getByRole('link', { name: 'Write an email' })).toHaveAttribute(
      'href',
      'mailto:hi@example.com'
    );
  });

  it('closes the fan on Escape and keeps the panel closed', async () => {
    const onOpenedChange = jest.fn();
    render(
      <ChatLauncher title="Assistant" onOpenedChange={onOpenedChange} actions={actions()}>
        <div />
      </ChatLauncher>
    );

    const button = screen.getByRole('button', { name: 'Show ways to get in touch' });
    await userEvent.click(button);
    await userEvent.keyboard('{Escape}');

    await waitFor(() => expect(button).toHaveFocus());
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(onOpenedChange).not.toHaveBeenCalled();
  });

  it('shows both faces of the button and takes the button size', () => {
    render(
      <ChatLauncher
        title="Assistant"
        buttonSize={64}
        iconAnimation="cover"
        altIcon={<span>Ada</span>}
        actions={actions()}
      >
        <div />
      </ChatLauncher>
    );

    expect(screen.getByText('Ada')).toBeInTheDocument();
    expect(document.querySelector('[data-animation="cover"]')).toBeInTheDocument();
    expect(
      document
        .querySelector<HTMLElement>('[data-position]')
        ?.style.getPropertyValue('--launcher-button-size')
    ).toBe('64px');
  });

  it('keeps the focus away from the hidden fan after a click', async () => {
    render(
      <ChatLauncher title="Assistant" actions={actions()}>
        <div />
      </ChatLauncher>
    );

    const button = screen.getByRole('button', { name: 'Show ways to get in touch' });
    await userEvent.click(button);
    await userEvent.click(screen.getByRole('button', { name: 'Request a call' }));

    await waitFor(() => expect(button).toHaveFocus());
  });

  it('leaves the focus alone when Escape comes from the page', async () => {
    render(
      <>
        <button type="button">Elsewhere</button>
        <ChatLauncher title="Assistant" actions={actions()}>
          <div />
        </ChatLauncher>
      </>
    );

    await userEvent.click(screen.getByRole('button', { name: 'Show ways to get in touch' }));
    const outside = screen.getByRole('button', { name: 'Elsewhere' });
    outside.focus();
    await userEvent.keyboard('{Escape}');

    expect(outside).toHaveFocus();
    expect(screen.getByRole('button', { name: 'Show ways to get in touch' })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
  });

  it('closes the fan on a click outside the launcher', async () => {
    render(
      <>
        <button type="button">Elsewhere</button>
        <ChatLauncher title="Assistant" actions={actions()}>
          <div />
        </ChatLauncher>
      </>
    );

    await userEvent.click(screen.getByRole('button', { name: 'Show ways to get in touch' }));
    await userEvent.click(screen.getByRole('button', { name: 'Elsewhere' }));

    expect(screen.getByRole('button', { name: 'Show ways to get in touch' })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
  });

  it('closes the fan when the panel is opened from the outside', async () => {
    function Host() {
      const [opened, setOpened] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setOpened(true)}>
            Open from the page
          </button>
          <ChatLauncher
            title="Assistant"
            opened={opened}
            onOpenedChange={setOpened}
            actions={actions()}
          >
            <div />
          </ChatLauncher>
        </>
      );
    }
    render(<Host />);

    await userEvent.click(screen.getByRole('button', { name: 'Show ways to get in touch' }));
    await userEvent.click(screen.getByRole('button', { name: 'Open from the page' }));

    expect(screen.getByRole('button', { name: 'Request a call', hidden: true })).toHaveAttribute(
      'tabindex',
      '-1'
    );
    expect(screen.getByRole('group', { hidden: true })).toHaveAttribute('aria-hidden', 'true');
  });

  it('keeps a disabled action out of the links', async () => {
    render(
      <ChatLauncher title="Assistant" actions={actions([{}, {}, { disabled: true }])}>
        <div />
      </ChatLauncher>
    );

    await userEvent.click(screen.getByRole('button', { name: 'Show ways to get in touch' }));
    expect(screen.queryByRole('link', { name: 'Write an email' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Write an email' })).toBeDisabled();
  });

  it('names the fan and carries the motion and the gap', async () => {
    render(
      <ChatLauncher title="Assistant" actionsMotion="together" actionGap={20} actions={actions()}>
        <div />
      </ChatLauncher>
    );

    await userEvent.click(screen.getByRole('button', { name: 'Show ways to get in touch' }));
    const group = screen.getByRole('group', { name: 'Show ways to get in touch' });
    expect(group).toHaveAttribute('data-motion', 'together');
    expect(group.style.getPropertyValue('--launcher-action-gap')).toBe('20px');
  });

  it('hides the unread badge while the actions are open', async () => {
    render(
      <ChatLauncher title="Assistant" unreadCount={3} actions={actions()}>
        <div />
      </ChatLauncher>
    );

    expect(
      screen.getByRole('button', { name: 'Show ways to get in touch, 3 unread' })
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Show ways to get in touch/ }));
    expect(screen.getByRole('button', { name: 'Hide ways to get in touch' })).toBeInTheDocument();
  });
});
