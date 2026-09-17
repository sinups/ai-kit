import React, { act } from 'react';
import { mountChatLauncher } from './mount-chat-launcher';
import { ChatLauncher } from './ChatLauncher';

describe('mountChatLauncher', () => {
  beforeAll(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  });

  it('renders the launcher inside a shadow root with scoped styles and cleans up', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);

    let mounted: ReturnType<typeof mountChatLauncher> | undefined;
    await act(async () => {
      mounted = mountChatLauncher(
        host,
        <ChatLauncher title="Support">
          <textarea aria-label="Message" />
        </ChatLauncher>,
        { styles: [':root { --widget: 1 }'] }
      );
    });

    const shadow = host.shadowRoot!;
    expect(shadow).not.toBeNull();
    expect(shadow.querySelector('style')?.textContent).toBe('.ae-shadow-root { --widget: 1 }');
    expect(shadow.querySelector('button[aria-label="Open chat"]')).not.toBeNull();
    expect(document.body.querySelector('button[aria-label="Open chat"]')).toBeNull();
    expect(mounted!.container.getAttribute('data-mantine-color-scheme')).toBe('light');

    await act(async () => {
      mounted!.unmount();
    });
    expect(shadow.childNodes).toHaveLength(0);
    host.remove();
  });

  it('renders into the target without a shadow root when shadow is off', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    let mounted: ReturnType<typeof mountChatLauncher> | undefined;
    await act(async () => {
      mounted = mountChatLauncher(host, <ChatLauncher>chat</ChatLauncher>, {
        shadow: false,
        styles: [':root {}'],
      });
    });
    expect(host.shadowRoot).toBeNull();
    expect(host.querySelector('style:not([data-mantine-styles])')).toBeNull();
    expect(host.querySelector('button[aria-label="Open chat"]')).not.toBeNull();
    await act(async () => {
      mounted!.unmount();
    });
    expect(host.childNodes).toHaveLength(0);
    host.remove();
  });
});
