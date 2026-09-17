import React from 'react';
import { Box } from '@mantine/core';
import { IconShare2 } from '@tabler/icons-react';
import { AgentChat } from '../AgentChat/AgentChat';
import { conversation } from '../MessageList/fixtures';
import { CHAT_WIDTH, LayoutHeader, useLayoutChat } from './shared';
import classes from './layouts.module.css';

export interface FullPageChatProps {
  /** Wraps long code and diff lines instead of scrolling, for phones */
  compact?: boolean;
}

/** One centered column: a quiet header, the feed without frames and the composer pinned to the bottom */
export function FullPageChat({ compact = false }: FullPageChatProps) {
  const chat = useLayoutChat(conversation);
  return (
    <Box className={classes.chatColumn}>
      <LayoutHeader
        title="Add retry to token refresh"
        columnWidth={CHAT_WIDTH}
        action={{ label: 'Share', icon: <IconShare2 size={16} /> }}
      />
      <AgentChat
        {...chat}
        contentWidth={CHAT_WIDTH}
        collapseToolRuns
        wrapLines={compact}
        alignComposer
        topFade
        className={classes.chat}
      />
    </Box>
  );
}
