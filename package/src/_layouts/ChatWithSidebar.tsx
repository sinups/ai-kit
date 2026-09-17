import React, { useState } from 'react';
import { ActionIcon, Box, Drawer, ScrollArea, Text, Tooltip } from '@mantine/core';
import { IconLayoutSidebar, IconMessagePlus, IconShare2 } from '@tabler/icons-react';
import { AgentChat } from '../AgentChat/AgentChat';
import { conversation } from '../MessageList/fixtures';
import { createSessionFixtures } from '../sessions/fixtures';
import { SessionList } from '../sessions/SessionList';
import type { SessionSummary } from '../sessions/types';
import { OVERLAY_INNER_CLASS } from '../styles/overlay';
import { CHAT_WIDTH, LayoutHeader, useLayoutChat } from './shared';
import classes from './layouts.module.css';

export interface ChatWithSidebarProps {
  /** Hides the sidebar behind a drawer, for phones */
  compact?: boolean;
}

function History({
  sessions,
  selectedId,
  onSelect,
}: {
  sessions: SessionSummary[];
  selectedId: string;
  onSelect: (session: SessionSummary) => void;
}) {
  return (
    <>
      <Box className={classes.sidebarTop}>
        <Text component="div" className={classes.sidebarBrand}>
          Workspace
        </Text>
      </Box>
      <ScrollArea className={classes.sidebarList} type="hover">
        <SessionList
          sessions={sessions}
          selectedId={selectedId}
          onSelect={onSelect}
          withSearch="on-demand"
          toolbar={
            <Tooltip label="New chat">
              <ActionIcon variant="subtle" color="gray" aria-label="New chat">
                <IconMessagePlus size={16} />
              </ActionIcon>
            </Tooltip>
          }
        />
      </ScrollArea>
    </>
  );
}

/** Narrow history sidebar separated by background and a hairline, next to the full-page chat column */
export function ChatWithSidebar({ compact = false }: ChatWithSidebarProps) {
  const chat = useLayoutChat(conversation);
  const [sessions] = useState(() => createSessionFixtures());
  const [selectedId, setSelectedId] = useState(sessions[0].id);
  const [historyOpened, setHistoryOpened] = useState(false);
  const selected = sessions.find((session) => session.id === selectedId);

  const history = (
    <History
      sessions={sessions}
      selectedId={selectedId}
      onSelect={(session) => {
        setSelectedId(session.id);
        setHistoryOpened(false);
      }}
    />
  );

  return (
    <Box className={classes.row}>
      {!compact && (
        <Box component="nav" className={classes.sidebar}>
          {history}
        </Box>
      )}
      <Box className={classes.chatColumn}>
        <LayoutHeader
          title={selected?.title}
          columnWidth={compact ? undefined : CHAT_WIDTH}
          leading={
            compact && (
              <ActionIcon
                variant="subtle"
                color="gray"
                aria-label="Open history"
                onClick={() => setHistoryOpened(true)}
                className={classes.headerAction}
              >
                <IconLayoutSidebar size={18} />
              </ActionIcon>
            )
          }
          action={{ label: 'Share', icon: <IconShare2 size={16} /> }}
        />
        <AgentChat
          {...chat}
          contentWidth={CHAT_WIDTH}
          collapseToolRuns
          alignComposer
          wrapLines={compact}
          topFade
          className={classes.chat}
        />
      </Box>
      {compact && (
        <Drawer
          opened={historyOpened}
          onClose={() => setHistoryOpened(false)}
          size="85%"
          withCloseButton={false}
          classNames={{
            inner: OVERLAY_INNER_CLASS,
            content: classes.drawerContent,
            body: classes.drawerBody,
          }}
        >
          {history}
        </Drawer>
      )}
    </Box>
  );
}
