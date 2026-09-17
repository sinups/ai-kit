import React from 'react';
import { Box } from '@mantine/core';
import { IconShare2 } from '@tabler/icons-react';
import { AgentChat } from '../AgentChat/AgentChat';
import { CHAT_WELCOME, CHAT_WIDTH, LayoutHeader, useLayoutChat } from './shared';
import classes from './layouts.module.css';

/** Empty new chat: a welcome with starter actions above the composer, or a centered greeting and composer; the feed appears after the first message */
export function NewChatEmptyState({ layout = 'welcome' }: { layout?: 'welcome' | 'center' }) {
  const chat = useLayoutChat([]);
  return (
    <Box className={classes.chatColumn}>
      <LayoutHeader
        title="New chat"
        columnWidth={CHAT_WIDTH}
        action={{ label: 'Share', icon: <IconShare2 size={16} /> }}
      />
      <AgentChat
        {...chat}
        contentWidth={CHAT_WIDTH}
        collapseToolRuns
        alignComposer
        topFade
        inputBarProps={{ placeholder: 'Ask anything' }}
        emptyState={
          layout === 'center'
            ? {
                layout: 'center',
                title: 'What should we work on?',
                suggestions: CHAT_WELCOME.actions?.map(({ id, label }) => ({ id, label })),
              }
            : CHAT_WELCOME
        }
        className={classes.chat}
      />
    </Box>
  );
}
