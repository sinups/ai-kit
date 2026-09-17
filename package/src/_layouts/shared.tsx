import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActionIcon, Box, Group, rem, Text, Tooltip } from '@mantine/core';
import { cx } from '../utils/cx';
import { IconBook2, IconBug, IconListCheck, IconSparkles } from '@tabler/icons-react';
import type { AgentChatEmptyState, ChatMessage, ChatStatus } from '../types';
import classes from './layouts.module.css';

export const CHAT_WIDTH = 760;

export const CHAT_WELCOME: AgentChatEmptyState = {
  avatar: <IconSparkles size={22} />,
  title: 'How can I help you today?',
  description: 'Ask about the code, fix a bug or plan a change.',
  actions: [
    {
      id: 'explain',
      label: 'Explain this repository',
      icon: <IconBook2 />,
    },
    {
      id: 'tests',
      label: 'Find flaky tests',
      icon: <IconBug />,
      badge: 'New',
    },
    {
      id: 'refactor',
      label: 'Plan a refactor',
      icon: <IconListCheck />,
    },
  ],
};

let messageId = 0;

export function useLayoutChat(initial: ChatMessage[]) {
  const [messages, setMessages] = useState(initial);
  const [status, setStatus] = useState<ChatStatus>('ready');
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const onSend = useCallback((message: { role: 'user'; content: string }) => {
    const id = `layout-${messageId++}`;
    setMessages((current) => [
      ...current,
      { id: `${id}-user`, role: 'user', parts: [{ type: 'text', text: message.content }] },
    ]);
    setStatus('submitted');
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setMessages((current) => [
        ...current,
        {
          id: `${id}-assistant`,
          role: 'assistant',
          parts: [
            { type: 'text', text: 'Looking into it. I will start with the files you mentioned.' },
          ],
        },
      ]);
      setStatus('ready');
    }, 700);
  }, []);

  const onStop = useCallback(() => {
    clearTimeout(timer.current);
    setStatus('ready');
  }, []);

  return { messages, status, onSend, onStop };
}

export interface LayoutHeaderProps {
  title: React.ReactNode;
  leading?: React.ReactNode;
  action?: { label: string; icon: React.ReactNode; onClick?: () => void };
  /** Aligns the header content with a centered column of this width */
  columnWidth?: number;
  className?: string;
}

export function LayoutHeader({
  title,
  leading,
  action,
  columnWidth,
  className,
}: LayoutHeaderProps) {
  return (
    <Group
      component="header"
      gap="xs"
      wrap="nowrap"
      className={cx(classes.header, className)}
      style={
        columnWidth
          ? ({ '--layout-column-width': rem(columnWidth) } as React.CSSProperties)
          : undefined
      }
      data-column={columnWidth ? true : undefined}
    >
      {leading}
      <Text component="h1" className={classes.headerTitle} truncate>
        {title}
      </Text>
      {action && (
        <Tooltip label={action.label}>
          <ActionIcon
            variant="subtle"
            color="gray"
            aria-label={action.label}
            onClick={action.onClick}
            className={classes.headerAction}
          >
            {action.icon}
          </ActionIcon>
        </Tooltip>
      )}
    </Group>
  );
}

export function DesktopViewport({ children }: { children: React.ReactNode }) {
  return <Box className={classes.viewport}>{children}</Box>;
}

export function MobileViewport({ children }: { children: React.ReactNode }) {
  return <Box className={cx(classes.viewport, classes.mobileViewport)}>{children}</Box>;
}
