"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActionIcon, Box, Group, SegmentedControl, Stack, Switch, Text } from "@mantine/core";
import { IconChartBar, IconKey, IconRefresh, IconSparkles, IconUsersPlus } from "@tabler/icons-react";
import { AgentChat, ChatLauncher, type ChatMessage, type ChatStatus } from "@sinups/ai-kit";

const WELCOME = {
  avatar: <IconSparkles size={22} />,
  title: "How can I help?",
  description: "Ask about your workspace, billing or the API.",
  actions: [
    { id: "invite", label: "Invite my team", icon: <IconUsersPlus /> },
    { id: "limits", label: "Explain usage limits", icon: <IconChartBar /> },
    { id: "tokens", label: "Create an API token", icon: <IconKey />, badge: "New" },
  ],
};

let messageId = 0;

export function useDemoChat(initial: ChatMessage[] = []) {
  const [messages, setMessages] = useState<ChatMessage[]>(initial);
  const [status, setStatus] = useState<ChatStatus>("ready");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const onSend = useCallback((message: { role: "user"; content: string }) => {
    messageId += 1;
    const id = `launcher-${messageId}`;
    setMessages((current) => [
      ...current,
      { id: `${id}-user`, role: "user", parts: [{ type: "text", text: message.content }] },
    ]);
    setStatus("submitted");
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setMessages((current) => [
        ...current,
        {
          id: `${id}-assistant`,
          role: "assistant",
          parts: [{ type: "text", text: "Open **Settings → Members** and choose **Invite**. Invited people get an email link." }],
        },
      ]);
      setStatus("ready");
    }, 700);
  }, []);

  const onStop = useCallback(() => {
    clearTimeout(timer.current);
    setStatus("ready");
  }, []);

  const reset = useCallback(() => {
    clearTimeout(timer.current);
    setMessages(initial);
    setStatus("ready");
  }, [initial]);

  return { messages, status, onSend, onStop, reset };
}

/** A fixed-height stand-in for a host page; the transform makes it the box the launcher is positioned in */
function HostPage({ width, children }: { width: number | "100%"; children: React.ReactNode }) {
  return (
    <Box
      className="relative mx-auto overflow-hidden rounded-lg border border-border bg-muted/40"
      style={{ width, maxWidth: "100%", height: 560, transform: "translateZ(0)" }}
    >
      <Stack gap={10} p={24} aria-hidden maw={520}>
        <Box h={14} w="40%" className="rounded bg-muted" />
        {["92%", "84%", "70%", "88%", "60%"].map((w, index) => (
          <Box key={index} h={8} w={w} className="rounded bg-muted" />
        ))}
      </Stack>
      {children}
    </Box>
  );
}

export function ChatLauncherPreview({
  defaultFrame = "desktop",
  position = "bottom-right",
  withUnread = false,
}: {
  defaultFrame?: "desktop" | "mobile";
  position?: "bottom-right" | "bottom-left";
  withUnread?: boolean;
}) {
  const [frame, setFrame] = useState(defaultFrame);
  const [opened, setOpened] = useState(false);
  const [unread, setUnread] = useState(withUnread ? 2 : 0);
  const chat = useDemoChat();

  return (
    <Stack gap="sm" className="w-full">
      <Group justify="space-between" wrap="wrap" gap="xs">
        <SegmentedControl
          size="xs"
          value={frame}
          onChange={(value) => setFrame(value as "desktop" | "mobile")}
          data={[
            { value: "desktop", label: "Desktop" },
            { value: "mobile", label: "Mobile" },
          ]}
        />
        <Text size="xs" c="dimmed">
          {opened ? "Press Escape or the close button" : "Click the button in the corner"}
        </Text>
      </Group>
      <HostPage key={frame} width={frame === "desktop" ? "100%" : 390}>
        <ChatLauncher
          withinPortal={false}
          title="Assistant"
          position={position}
          offset={16}
          panelHeight={500}
          opened={opened}
          onOpenedChange={(next) => {
            setOpened(next);
            if (next) setUnread(0);
          }}
          unreadCount={unread}
          headerActions={
            <ActionIcon variant="subtle" color="gray" aria-label="New conversation" onClick={chat.reset}>
              <IconRefresh size={16} />
            </ActionIcon>
          }
        >
          <AgentChat
            messages={chat.messages}
            status={chat.status}
            onSend={chat.onSend}
            onStop={chat.onStop}
            contentWidth="100%"
            wrapLines
            alignComposer
            topFade
            emptyState={WELCOME}
          />
        </ChatLauncher>
      </HostPage>
    </Stack>
  );
}

function UnreadPreview() {
  const [keepMounted, setKeepMounted] = useState(true);
  return (
    <Stack gap="sm" className="w-full">
      <Switch
        size="xs"
        label="Keep the chat mounted while closed"
        checked={keepMounted}
        onChange={(event) => setKeepMounted(event.currentTarget.checked)}
      />
      <KeepMountedLauncher key={String(keepMounted)} keepMounted={keepMounted} />
    </Stack>
  );
}

function KeepMountedLauncher({ keepMounted }: { keepMounted: boolean }) {
  const chat = useDemoChat();
  const [unread, setUnread] = useState(3);
  return (
    <HostPage width="100%">
      <ChatLauncher
        withinPortal={false}
        title="Assistant"
        position="bottom-left"
        offset={16}
        panelHeight={500}
        keepMounted={keepMounted}
        unreadCount={unread}
        onOpenedChange={(next) => next && setUnread(0)}
      >
        <AgentChat
          messages={chat.messages}
          status={chat.status}
          onSend={chat.onSend}
          onStop={chat.onStop}
          contentWidth="100%"
          wrapLines
          alignComposer
          emptyState={WELCOME}
        />
      </ChatLauncher>
    </HostPage>
  );
}

export function renderLauncherPreview(previewId: string): React.ReactNode | undefined {
  switch (previewId) {
    case "ChatLauncher":
    case "ChatLauncher/frames":
      return <ChatLauncherPreview />;
    case "ChatLauncher/mobile":
      return <ChatLauncherPreview defaultFrame="mobile" />;
    case "ChatLauncher/unread":
      return <UnreadPreview />;
    default:
      return undefined;
  }
}
