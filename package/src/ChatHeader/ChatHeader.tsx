import React, { memo } from 'react';
import { Box, Text } from '@mantine/core';
import { cx } from '../utils/cx';
import classes from './ChatHeader.module.css';

export interface ChatHeaderLabels {
  /** Accessible name of the header landmark, `Chat header` by default */
  header: string;
}

export const DEFAULT_CHAT_HEADER_LABELS: ChatHeaderLabels = {
  header: 'Chat header',
};

export interface ChatHeaderProps {
  /** Name of the conversation, truncated instead of wrapping */
  title: React.ReactNode;
  /** Second line under the title, for example the model or the workspace; dropped when narrow */
  subtitle?: React.ReactNode;
  /** Before the title: a back button, a sidebar toggle, an avatar */
  leftSection?: React.ReactNode;
  /** Next to the title: badges, connection state, context usage; dropped when narrow */
  secondarySection?: React.ReactNode;
  /** At the end: panel buttons, menus, anything that must stay reachable at any width */
  rightSection?: React.ReactNode;
  /** Heading level of the title, `2` by default */
  titleOrder?: 1 | 2 | 3 | 4 | 5 | 6;
  /** Draws the line under the header, `true` by default */
  withBorder?: boolean;
  /** Hides the subtitle and the secondary section in a narrow container, `true` by default */
  collapseSecondary?: boolean;
  /** Overrides of the default English labels */
  labels?: Partial<ChatHeaderLabels>;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

/** Top bar of a chat surface: title and subtitle, leading controls, badges and panel buttons */
export const ChatHeader = memo(function ChatHeader({
  title,
  subtitle,
  leftSection,
  secondarySection,
  rightSection,
  titleOrder = 2,
  withBorder = true,
  collapseSecondary = true,
  labels: labelsProp,
  className,
  style,
}: ChatHeaderProps) {
  const labels = { ...DEFAULT_CHAT_HEADER_LABELS, ...labelsProp };

  return (
    <Box
      component="header"
      aria-label={labels.header}
      className={cx(classes.root, className)}
      data-with-border={withBorder || undefined}
      data-collapse-secondary={collapseSecondary || undefined}
      style={style}
    >
      {leftSection && <div className={classes.left}>{leftSection}</div>}
      <div className={classes.titles}>
        <Text component={`h${titleOrder}` as const} className={classes.title} truncate>
          {title}
        </Text>
        {subtitle && (
          <Text component="p" className={classes.subtitle} truncate>
            {subtitle}
          </Text>
        )}
      </div>
      {secondarySection && <div className={classes.secondary}>{secondarySection}</div>}
      {rightSection && <div className={classes.right}>{rightSection}</div>}
    </Box>
  );
});

ChatHeader.displayName = 'ChatHeader';
