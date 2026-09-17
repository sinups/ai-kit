import React from 'react';
import { Box } from '@mantine/core';
import { AgentChat } from '../AgentChat/AgentChat';
import { ChatLauncher } from '../launcher/ChatLauncher';
import { conversation } from '../MessageList/fixtures';
import { CHAT_WELCOME, useLayoutChat } from './shared';
import classes from './layouts.module.css';

const HOST_LINES = ['70%', '92%', '84%', '40%', '88%', '76%', '64%'];

/** Assistant launcher in the corner of a host application page */
export function EmbeddedWidget({
  defaultOpened = true,
  empty = false,
}: {
  defaultOpened?: boolean;
  empty?: boolean;
}) {
  const chat = useLayoutChat(empty ? [] : conversation);
  return (
    <Box className={classes.host}>
      <Box className={classes.hostPage} aria-hidden>
        {HOST_LINES.map((width, index) => (
          <Box key={index} className={classes.hostLine} w={width} />
        ))}
      </Box>
      <ChatLauncher title="Assistant" defaultOpened={defaultOpened} withinPortal={false}>
        <AgentChat
          {...chat}
          contentWidth="100%"
          collapseToolRuns
          wrapLines
          emptyState={CHAT_WELCOME}
          alignComposer
          topFade
        />
      </ChatLauncher>
    </Box>
  );
}
