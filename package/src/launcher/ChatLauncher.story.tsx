import React, { useEffect, useRef, useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from '@storybook/test';
import {
  ActionIcon,
  Anchor,
  Box,
  Button,
  Group,
  Stack,
  Text,
  useMantineTheme,
} from '@mantine/core';
import { IconRefresh } from '@tabler/icons-react';
import { AgentChat } from '../AgentChat/AgentChat';
import { conversation } from '../MessageList/fixtures';
import { AiKitProvider } from '../theme/AiKitProvider';
import { CHAT_WELCOME, useLayoutChat } from '../_layouts/shared';
import type { ChatMessage } from '../types';
import { ChatLauncher, type ChatLauncherProps } from './ChatLauncher';
import { mountChatLauncher } from './mount-chat-launcher';

export default { title: 'launcher/ChatLauncher', parameters: { layout: 'fullscreen' } };

const MOBILE_VIEWPORT = {
  viewport: {
    viewports: {
      phone390: {
        name: 'Phone 390',
        styles: { width: '390px', height: '844px' },
        type: 'mobile',
      },
    },
    defaultViewport: 'phone390',
  },
};

function LauncherChat({ initial = conversation }: { initial?: ChatMessage[] }) {
  const chat = useLayoutChat(initial);
  return (
    <AgentChat
      {...chat}
      contentWidth="100%"
      collapseToolRuns
      wrapLines
      alignComposer
      topFade
      emptyState={CHAT_WELCOME}
    />
  );
}

function RefreshAction() {
  return (
    <ActionIcon variant="subtle" color="gray" aria-label="New conversation">
      <IconRefresh size={16} />
    </ActionIcon>
  );
}

function Launcher(props: Partial<ChatLauncherProps> & { initial?: ChatMessage[] }) {
  const { initial, ...rest } = props;
  return (
    <ChatLauncher title="Assistant" headerActions={<RefreshAction />} {...rest}>
      <LauncherChat initial={initial} />
    </ChatLauncher>
  );
}

function HostPage({ children }: { children?: React.ReactNode }) {
  return (
    <Box mih="100dvh" bg="var(--ae-bg-tertiary)" c="var(--ae-fg)">
      <Group justify="space-between" px={32} h={64}>
        <Text fw={600}>Northwind Docs</Text>
        <Group gap={24}>
          {['Guides', 'API', 'Pricing', 'Support'].map((item) => (
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
          Connect a workspace, invite your team and import the first project. The setup takes a few
          minutes and every step can be changed later from the settings page.
        </Text>
        <Text c="var(--ae-fg-muted)">
          Questions along the way go to the assistant in the corner: it knows the guides and can
          walk through a step with you.
        </Text>
      </Stack>
      {children}
    </Box>
  );
}

export function Closed() {
  return <Launcher />;
}

export function Open() {
  return <Launcher defaultOpened />;
}

export function Welcome() {
  return <Launcher defaultOpened initial={[]} />;
}

export const MobileWelcome = {
  parameters: MOBILE_VIEWPORT,
  render: () => <Launcher defaultOpened initial={[]} />,
};

export function WithUnread() {
  return <Launcher unreadCount={3} />;
}

export function BottomLeft() {
  return <Launcher defaultOpened position="bottom-left" />;
}

export const Mobile = {
  parameters: MOBILE_VIEWPORT,
  render: () => <Launcher defaultOpened />,
};

export function OnHostPage() {
  return (
    <HostPage>
      <Launcher unreadCount={1} initial={[]} />
    </HostPage>
  );
}

const HOSTILE_CSS = `
  .hostile-page button { background: hotpink !important; border-radius: 0 !important; }
  .hostile-page textarea { font-family: serif !important; font-size: 22px !important; }
`;

function ShadowLauncher() {
  const hostRef = useRef<HTMLDivElement>(null);
  const theme = useMantineTheme();
  const scheme = document.documentElement.getAttribute('data-mantine-color-scheme');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!hostRef.current) {
      return undefined;
    }
    const widget = mountChatLauncher(hostRef.current, <Launcher defaultOpened />, {
      adoptDocumentStyles: true,
      theme: { fontFamily: theme.fontFamily, fontFamilyMonospace: theme.fontFamilyMonospace },
      colorScheme: scheme === 'dark' ? 'dark' : 'light',
      wrap: (element) => <AiKitProvider>{element}</AiKitProvider>,
    });
    setMounted(true);
    return widget.unmount;
  }, [theme.fontFamily, theme.fontFamilyMonospace, scheme]);

  return (
    <HostPage>
      <style>{HOSTILE_CSS}</style>
      <Box className="hostile-page" px={32}>
        <Group gap={12}>
          <button type="button">Host button</button>
          <textarea aria-label="Host field" defaultValue="Host textarea" />
        </Group>
        <Text size="sm" c="var(--ae-fg-muted)" mt={16}>
          {mounted ? 'The widget below lives in a shadow root.' : 'Mounting…'}
        </Text>
      </Box>
      <div ref={hostRef} />
    </HostPage>
  );
}

export function ShadowDom() {
  return <ShadowLauncher />;
}

type FlowArgs = { onOpenedChange: (opened: boolean) => void };

function findScroller(scope: HTMLElement): HTMLElement {
  const scroller = Array.from(scope.querySelectorAll<HTMLElement>('*')).find(
    (element) =>
      element.scrollHeight > element.clientHeight + 1 &&
      ['auto', 'scroll'].includes(getComputedStyle(element).overflowY)
  );
  if (!scroller) {
    throw new Error('No scrollable feed in the panel');
  }
  return scroller;
}

export const Flow = {
  args: { onOpenedChange: fn() },
  render: (args: FlowArgs) => (
    <HostPage>
      <Launcher onOpenedChange={args.onOpenedChange} />
    </HostPage>
  ),
  play: async ({ canvasElement, args }: { canvasElement: HTMLElement; args: FlowArgs }) => {
    const page = within(canvasElement.ownerDocument.body);
    const launcher = page.getByRole('button', { name: 'Open chat' });
    await expect(launcher).toHaveAttribute('aria-expanded', 'false');
    const buttonRect = launcher.getBoundingClientRect();

    await userEvent.click(launcher);
    await expect(args.onOpenedChange).toHaveBeenLastCalledWith(true);
    const dialog = await page.findByRole('dialog', { name: 'Assistant' });
    const composer = within(dialog).getByRole('textbox');
    await waitFor(() => expect(composer).toHaveFocus());
    const height = dialog.offsetHeight;

    await waitFor(() => expect(launcher).not.toBeVisible());
    await expect(launcher).toHaveAttribute('tabindex', '-1');

    await userEvent.type(composer, 'How do I invite my team?{Enter}');
    await waitFor(() => expect(within(dialog).getByText('How do I invite my team?')).toBeVisible());
    await waitFor(() => expect(within(dialog).getByText(/Looking into it/)).toBeVisible(), {
      timeout: 3000,
    });
    await expect(dialog.offsetHeight).toBe(height);

    const scroller = findScroller(dialog);
    const bottom = scroller.scrollTop;
    scroller.scrollTop = 0;
    await waitFor(() => expect(scroller.scrollTop).toBeLessThan(bottom));
    await expect(dialog.offsetHeight).toBe(height);
    await expect(within(dialog).getByRole('textbox')).toBeVisible();

    await userEvent.keyboard('{Escape}');
    await expect(args.onOpenedChange).toHaveBeenLastCalledWith(false);
    await waitFor(() => expect(launcher).toHaveFocus());
    await expect(launcher).toHaveAttribute('aria-expanded', 'false');
    await waitFor(() => expect(launcher).toBeVisible());
    await waitFor(() => {
      const rect = launcher.getBoundingClientRect();
      expect([rect.top, rect.left, rect.width]).toEqual([
        buttonRect.top,
        buttonRect.left,
        buttonRect.width,
      ]);
    });

    await userEvent.click(launcher);
    const reopened = await page.findByRole('dialog', { name: 'Assistant' });
    await waitFor(() =>
      expect(within(reopened).getByText('How do I invite my team?')).toBeVisible()
    );
    await waitFor(() => expect(within(reopened).getByRole('textbox')).toHaveFocus());
    await expect(reopened.offsetHeight).toBe(height);
  },
};

const FRAME_WIDTHS = [375, 600, 1024];

function ResizableFrame({ children }: { children: React.ReactNode }) {
  const [width, setWidth] = useState(1024);
  return (
    <Stack gap={12} p={16}>
      <Group gap={8}>
        {FRAME_WIDTHS.map((value) => (
          <Button
            key={value}
            size="xs"
            variant={value === width ? 'filled' : 'default'}
            onClick={() => setWidth(value)}
          >
            {value}px
          </Button>
        ))}
      </Group>
      <Box
        data-testid="frame"
        w={width}
        h={640}
        pos="relative"
        style={{
          transform: 'translateZ(0)',
          overflow: 'hidden',
          outline: '1px solid var(--ae-border)',
        }}
      >
        {children}
      </Box>
    </Stack>
  );
}

export const ResizeFlow = {
  args: { onOpenedChange: fn() },
  render: (args: FlowArgs) => (
    <ResizableFrame>
      <Launcher initial={[]} withinPortal={false} onOpenedChange={args.onOpenedChange} />
    </ResizableFrame>
  ),
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Open chat' }));
    const dialog = await canvas.findByRole('dialog', { name: 'Assistant' });
    const root = dialog.parentElement!;
    const composer = within(dialog).getByRole('textbox');
    await waitFor(() => expect(composer).toHaveFocus());
    await userEvent.type(composer, 'Keep this message{Enter}');
    await waitFor(() => expect(within(dialog).getByText('Keep this message')).toBeVisible());
    await expect(root).toHaveAttribute('data-mode', 'compact');

    await userEvent.click(canvas.getByRole('button', { name: '375px' }));
    await waitFor(() => expect(root).toHaveAttribute('data-mode', 'fullscreen'));
    await waitFor(() => expect(dialog.getBoundingClientRect().width).toBe(375));
    await expect(within(dialog).getByText('Keep this message')).toBeVisible();

    await userEvent.click(canvas.getByRole('button', { name: '600px' }));
    await waitFor(() => expect(root).toHaveAttribute('data-mode', 'compact'));

    await userEvent.click(canvas.getByRole('button', { name: '1024px' }));
    await waitFor(() => expect(root).toHaveAttribute('data-mode', 'compact'));
    await expect(within(dialog).getByRole('textbox')).toBe(composer);
    await expect(within(dialog).getByText('Keep this message')).toBeVisible();
  },
};
