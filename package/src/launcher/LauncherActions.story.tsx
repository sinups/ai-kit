import React from 'react';
import { expect, userEvent, waitFor, within } from '@storybook/test';
import { Anchor, Avatar, Box, Group, Paper, Stack, Text } from '@mantine/core';
import {
  IconCalendarEvent,
  IconHeadset,
  IconMail,
  IconMessageCircle,
  IconPhone,
} from '@tabler/icons-react';
import { AgentChat } from '../AgentChat/AgentChat';
import { conversation } from '../MessageList/fixtures';
import { CHAT_WELCOME, useLayoutChat } from '../_layouts/shared';
import { ChatLauncher } from './ChatLauncher';
import type { LauncherAction } from './LauncherActions';

export default { title: 'Settings/LauncherActions', parameters: { layout: 'fullscreen' } };

const ACTIONS: LauncherAction[] = [
  {
    id: 'chat',
    label: 'Chat with the assistant',
    icon: <IconMessageCircle size={22} stroke={1.75} />,
    opensChat: true,
    unreadCount: 2,
  },
  { id: 'call', label: 'Request a call back', icon: <IconPhone size={20} stroke={1.75} /> },
  {
    id: 'meeting',
    label: 'Book a demo',
    icon: <IconCalendarEvent size={20} stroke={1.75} />,
    color: 'grape',
  },
  {
    id: 'mail',
    label: 'Write to support',
    icon: <IconMail size={20} stroke={1.75} />,
    href: 'mailto:support@example.com',
    color: 'teal',
  },
];

function LauncherChat() {
  const chat = useLayoutChat(conversation);
  return (
    <AgentChat {...chat} contentWidth="100%" wrapLines alignComposer emptyState={CHAT_WELCOME} />
  );
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
          Getting started
        </Text>
        <Text c="var(--ae-fg-muted)">
          Pick the way that suits you: ask the assistant, leave a phone number or book a call with
          the team.
        </Text>
      </Stack>
      {children}
    </Box>
  );
}

export function Usage() {
  return (
    <HostPage>
      <ChatLauncher title="Assistant" actions={ACTIONS} unreadCount={2}>
        <LauncherChat />
      </ChatLauncher>
    </HostPage>
  );
}

const AVATAR = <Avatar size={56} radius="xl" variant="filled" name="Ada Lane" color="grape" />;

function Frame({ caption, children }: { caption: string; children: React.ReactNode }) {
  return (
    <Stack gap={8}>
      <Text size="xs" c="var(--ae-fg-muted)">
        {caption}
      </Text>
      <Paper
        withBorder
        radius="md"
        pos="relative"
        h={320}
        w={260}
        bg="var(--ae-bg-secondary)"
        style={{ overflow: 'hidden', transform: 'translateZ(0)' }}
      >
        {children}
      </Paper>
    </Stack>
  );
}

export function Variants() {
  return (
    <Group align="flex-start" gap={24} p={24} wrap="wrap">
      <Frame caption="Rings around the closed button">
        <ChatLauncher withinPortal={false} title="Assistant" offset={16} pulse actions={ACTIONS}>
          <LauncherChat />
        </ChatLauncher>
      </Frame>
      <Frame caption="Avatar takes the place of the icon">
        <ChatLauncher
          withinPortal={false}
          title="Assistant"
          offset={16}
          iconAnimation="swap"
          altIcon={AVATAR}
          actions={ACTIONS}
        >
          <LauncherChat />
        </ChatLauncher>
      </Frame>
      <Frame caption="Button flips to the avatar">
        <ChatLauncher
          withinPortal={false}
          title="Assistant"
          offset={16}
          iconAnimation="flip"
          altIcon={AVATAR}
          actions={ACTIONS}
        >
          <LauncherChat />
        </ChatLauncher>
      </Frame>
      <Frame caption="Avatar grows over the icon">
        <ChatLauncher
          withinPortal={false}
          title="Assistant"
          offset={16}
          iconAnimation="cover"
          altIcon={AVATAR}
          actions={ACTIONS}
        >
          <LauncherChat />
        </ChatLauncher>
      </Frame>
      <Frame caption="Actions leave together">
        <ChatLauncher
          withinPortal={false}
          title="Assistant"
          offset={16}
          actionsMotion="together"
          actions={ACTIONS}
        >
          <LauncherChat />
        </ChatLauncher>
      </Frame>
      <Frame caption="Small button, small actions">
        <ChatLauncher
          withinPortal={false}
          title="Assistant"
          offset={16}
          buttonSize={48}
          actionSize={40}
          actions={ACTIONS}
        >
          <LauncherChat />
        </ChatLauncher>
      </Frame>
      <Frame caption="Large button, large actions">
        <ChatLauncher
          withinPortal={false}
          title="Assistant"
          offset={16}
          buttonSize={64}
          actionSize={56}
          actions={ACTIONS}
        >
          <LauncherChat />
        </ChatLauncher>
      </Frame>
    </Group>
  );
}

export function Pulse() {
  return (
    <HostPage>
      <ChatLauncher title="Assistant" actions={ACTIONS} pulse iconAnimation="swap" altIcon={AVATAR}>
        <LauncherChat />
      </ChatLauncher>
    </HostPage>
  );
}

export function BottomLeft() {
  return (
    <HostPage>
      <ChatLauncher
        title="Assistant"
        position="bottom-left"
        actions={ACTIONS.slice(0, 3)}
        icon={<IconHeadset size={24} stroke={1.75} />}
      >
        <LauncherChat />
      </ChatLauncher>
    </HostPage>
  );
}

export const OpenedFlow = {
  render: () => (
    <HostPage>
      <ChatLauncher title="Assistant" actions={ACTIONS}>
        <LauncherChat />
      </ChatLauncher>
    </HostPage>
  ),
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement.ownerDocument.body);
    await userEvent.click(await canvas.findByRole('button', { name: /Show ways/ }));
    await waitFor(() =>
      expect(canvas.getByRole('button', { name: 'Request a call back' })).toBeVisible()
    );
  },
};
