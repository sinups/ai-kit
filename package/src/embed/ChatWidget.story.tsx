import React, { useEffect, useRef } from 'react';
import { expect, userEvent, waitFor } from '@storybook/test';
import { Anchor, Box, Group, Stack, Text } from '@mantine/core';
import type { ChatWidgetOptions } from './options';
import { createChatWidget, type ChatWidget } from './widget';

export default { title: 'Embed/ChatWidget', parameters: { layout: 'fullscreen' } };

const CHAT_PAGE = `data:text/html,${encodeURIComponent(
  `<!doctype html><html><body style="margin:0;font:15px/1.5 system-ui;display:flex;align-items:center;justify-content:center;height:100vh;color:gray">Chat page of the host</body></html>`
)}`;

const ACTIONS: ChatWidgetOptions['actions'] = [
  { id: 'chat', label: 'Chat with the assistant', icon: 'chat', opensChat: true },
  { id: 'call', label: 'Request a call back', icon: 'circle', href: 'tel:+10000000' },
  { id: 'mail', label: 'Write to support', icon: 'send', href: 'mailto:hi@example.com' },
];

function Widget({
  options,
  onReady,
}: {
  options: ChatWidgetOptions;
  onReady?: (widget: ChatWidget) => void;
}) {
  const ready = useRef(onReady);
  ready.current = onReady;

  useEffect(() => {
    const widget = createChatWidget({ url: CHAT_PAGE, ...options });
    ready.current?.(widget);
    return () => widget.destroy();
  }, [options]);

  return null;
}

function HostPage({ children }: { children: React.ReactNode }) {
  return (
    <Box mih="100dvh" bg="var(--ae-bg-tertiary)" c="var(--ae-fg)">
      <Group justify="space-between" px={32} h={64}>
        <Text fw={600}>Northwind Docs</Text>
        <Group gap={24}>
          {['Guides', 'API', 'Pricing'].map((item) => (
            <Anchor key={item} size="sm" c="var(--ae-fg-muted)" underline="never">
              {item}
            </Anchor>
          ))}
        </Group>
      </Group>
      <Stack gap={16} maw={680} px={32} py={48}>
        <Text component="h1" size="xl" fw={600} m={0}>
          A page that knows nothing about React
        </Text>
        <Text c="var(--ae-fg-muted)">
          The button in the corner comes from one script: no dependencies, its own shadow root, and
          the chat opens in an iframe on the address the page gives it.
        </Text>
      </Stack>
      {children}
    </Box>
  );
}

export function Usage() {
  return (
    <HostPage>
      <Widget options={{ title: 'Assistant', color: 'rgb(17, 17, 17)', actions: ACTIONS }} />
    </HostPage>
  );
}

export function TopLeft() {
  return (
    <HostPage>
      <Widget
        options={{ title: 'Assistant', location: ['top', 'left'], actions: ACTIONS, icon: 'dots' }}
      />
    </HostPage>
  );
}

export const Notifications = {
  parameters: { visual: { skip: true } },
  render: () => (
    <HostPage>
      <Widget
        options={{ title: 'Assistant', actions: ACTIONS }}
        onReady={(widget) => {
          widget.notify({
            title: 'Anna from support',
            text: 'Delivery across the EU takes 3 to 5 working days',
            timeout: false,
          });
          widget.notify({ text: 'Shall I compare the plans with you?', timeout: false });
        }}
      />
    </HostPage>
  ),
};

export const Attention = {
  parameters: { visual: { skip: true } },
  render: () => (
    <HostPage>
      <Widget
        options={{
          title: 'Assistant',
          pulse: true,
          iconAnimation: 'coin',
          avatar: 'https://i.pravatar.cc/120?img=12',
          actions: ACTIONS,
        }}
      />
    </HostPage>
  ),
};

export const OpenedFlow = {
  parameters: { visual: { skip: true } },
  render: () => (
    <HostPage>
      <Widget options={{ title: 'Assistant', actions: ACTIONS }} />
    </HostPage>
  ),
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const shadow = canvasElement.ownerDocument.querySelector('ai-kit-widget')?.shadowRoot;
    await waitFor(() => expect(shadow?.querySelector('.multi_button')).toBeTruthy());
    await userEvent.click(shadow?.querySelector('.multi_button') as HTMLElement);
    await waitFor(() => expect(shadow?.querySelector('[data-action="call"]')).toBeVisible());
  },
};
