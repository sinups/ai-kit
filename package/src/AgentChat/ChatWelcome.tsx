import React, { memo, useRef } from 'react';
import { Avatar, Badge, Box, Stack, Text, UnstyledButton } from '@mantine/core';
import { cx } from '../utils/cx';
import classes from './ChatWelcome.module.css';

export type ChatWelcomeAction = {
  /** Unique action id */
  id: string;
  /** Row label */
  label: string;
  /** Icon rendered before the label */
  icon?: React.ReactNode;
  /** Tag after the label, a string renders as a small accent badge, for example `New` */
  badge?: React.ReactNode;
  /** Text inserted into the composer when the action has no `onSelect`, `label` by default */
  value?: string;
  /** Runs instead of inserting text into the composer */
  onSelect?: () => void;
};

export interface ChatWelcomeLabels {
  /** Accessible label of the action list, `Suggested actions` by default */
  actions: string;
}

export const DEFAULT_CHAT_WELCOME_LABELS: ChatWelcomeLabels = {
  actions: 'Suggested actions',
};

export interface ChatWelcomeProps {
  /** Logo or avatar shown in a 48px circle */
  avatar?: React.ReactNode;
  /** Greeting, for example `How can I help you today?` */
  title?: React.ReactNode;
  /** Text under the greeting */
  description?: React.ReactNode;
  /** Actions listed under the greeting */
  actions?: ChatWelcomeAction[];
  /** Called for an action without its own `onSelect` */
  onAction?: (action: ChatWelcomeAction) => void;
  /** Overrides of the default English labels */
  labels?: Partial<ChatWelcomeLabels>;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

/** Welcome screen of an empty chat: avatar, greeting and a list of starter actions pinned above the composer */
export const ChatWelcome = memo(function ChatWelcome({
  avatar,
  title,
  description,
  actions = [],
  onAction,
  labels: labelsProp,
  className,
  style,
}: ChatWelcomeProps) {
  const labels = { ...DEFAULT_CHAT_WELCOME_LABELS, ...labelsProp };
  const listRef = useRef<HTMLDivElement>(null);

  const moveFocus = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const buttons = Array.from(
      listRef.current?.querySelectorAll<HTMLButtonElement>('[data-welcome-action]') ?? []
    );
    const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
    let next = -1;
    if (event.key === 'ArrowDown') {
      next = index < 0 ? 0 : (index + 1) % buttons.length;
    } else if (event.key === 'ArrowUp') {
      next = index <= 0 ? buttons.length - 1 : index - 1;
    } else if (event.key === 'Home') {
      next = 0;
    } else if (event.key === 'End') {
      next = buttons.length - 1;
    }
    if (next >= 0 && buttons[next]) {
      event.preventDefault();
      buttons[next].focus();
    }
  };

  return (
    <Box className={cx(classes.root, className)} style={style} data-chat-welcome>
      <div className={classes.spacerTop} aria-hidden />
      <div className={classes.content}>
        <Stack gap={6}>
          {avatar && (
            <Avatar size={48} radius="xl" className={classes.avatar} mb={6}>
              {avatar}
            </Avatar>
          )}
          {title && (
            <Text component="h2" size="sm" fw={500} className={classes.title}>
              {title}
            </Text>
          )}
          {description && (
            <Text size="sm" c="dimmed">
              {description}
            </Text>
          )}
        </Stack>
        {actions.length > 0 && (
          <Stack
            ref={listRef}
            gap={2}
            role="group"
            aria-label={labels.actions}
            className={classes.actions}
            onKeyDown={moveFocus}
          >
            {actions.map((action) => (
              <UnstyledButton
                key={action.id}
                className={classes.action}
                data-welcome-action
                onClick={() => (action.onSelect ? action.onSelect() : onAction?.(action))}
              >
                {action.icon && (
                  <span className={classes.actionIcon} aria-hidden>
                    {action.icon}
                  </span>
                )}
                <span className={classes.actionLabel}>{action.label}</span>
                {typeof action.badge === 'string' ? (
                  <Badge size="xs" radius="sm" tt="none" className={classes.badge}>
                    {action.badge}
                  </Badge>
                ) : (
                  action.badge
                )}
              </UnstyledButton>
            ))}
          </Stack>
        )}
      </div>
      <div className={classes.spacerBottom} aria-hidden />
    </Box>
  );
});

ChatWelcome.displayName = 'ChatWelcome';
