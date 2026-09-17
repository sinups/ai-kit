import React, { useRef, useState } from 'react';
import { Box, Drawer, Splitter, Text } from '@mantine/core';
import type { UseSplitterReturnValue } from '@mantine/hooks';
import { IconLayoutSidebarRight } from '@tabler/icons-react';
import { AgentChat } from '../AgentChat/AgentChat';
import { DiffReview } from '../diff/DiffReview/DiffReview';
import { DIFF_FIXTURES } from '../diff/fixtures';
import type { FileChange, FileDecision } from '../diff/types';
import { conversation } from '../MessageList/fixtures';
import { OVERLAY_INNER_CLASS } from '../styles/overlay';
import { BackgroundTasksPanel } from '../tasks/BackgroundTasksPanel/BackgroundTasksPanel';
import { createTaskFixtures } from '../tasks/fixtures';
import { CHAT_WIDTH, LayoutHeader, useLayoutChat } from './shared';
import classes from './layouts.module.css';

export interface ChatWithInspectorProps {
  /** Opens the inspector in a bottom drawer instead of a resizable side pane, for phones */
  compact?: boolean;
  /** Content of the inspector, `diff` by default */
  inspector?: 'diff' | 'tasks';
  /** Opens the inspector drawer on mount in compact mode */
  defaultOpened?: boolean;
}

function Inspector({ kind }: { kind: 'diff' | 'tasks' }) {
  const [decisions, setDecisions] = useState<Record<string, FileDecision>>({});
  const [tasks] = useState(() => createTaskFixtures());
  const decide = (decision: FileDecision) => (change: FileChange) =>
    setDecisions((current) => ({ ...current, [change.path]: decision }));
  const header = (
    <Text component="h2" className={classes.headerTitle}>
      {kind === 'diff' ? 'Changes' : 'Background tasks'}
    </Text>
  );

  return (
    <Box className={classes.inspector}>
      {kind === 'diff' ? (
        <DiffReview
          changes={DIFF_FIXTURES}
          decisions={decisions}
          onAccept={decide('accepted')}
          onReject={decide('rejected')}
          withHotkeys={false}
          header={header}
        />
      ) : (
        <BackgroundTasksPanel tasks={tasks} header={header} />
      )}
    </Box>
  );
}

/** Chat next to a resizable, collapsible inspector (diff review or tasks); a bottom drawer on phones */
export function ChatWithInspector({
  compact = false,
  inspector = 'diff',
  defaultOpened = false,
}: ChatWithInspectorProps) {
  const chat = useLayoutChat(conversation);
  const splitterRef = useRef<UseSplitterReturnValue | null>(null);
  const [drawerOpened, setDrawerOpened] = useState(defaultOpened);

  const togglePanel = () => {
    if (compact) {
      setDrawerOpened((opened) => !opened);
      return;
    }
    splitterRef.current?.toggleCollapse(1);
  };

  const chatColumn = (
    <Box className={classes.chatColumn}>
      <LayoutHeader
        title="Add retry to token refresh"
        columnWidth={CHAT_WIDTH}
        action={{
          label: inspector === 'diff' ? 'Toggle changes' : 'Toggle tasks',
          icon: <IconLayoutSidebarRight size={18} />,
          onClick: togglePanel,
        }}
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
  );

  if (compact) {
    return (
      <>
        {chatColumn}
        <Drawer
          opened={drawerOpened}
          onClose={() => setDrawerOpened(false)}
          position="bottom"
          size="92%"
          withCloseButton={false}
          classNames={{
            inner: OVERLAY_INNER_CLASS,
            content: classes.drawerContent,
            body: classes.drawerBody,
          }}
        >
          <Inspector kind={inspector} />
        </Drawer>
      </>
    );
  }

  return (
    <Splitter
      className={classes.splitter}
      splitterRef={splitterRef}
      withHandle={false}
      lineSize={1}
      handleColor="var(--ae-border)"
    >
      <Splitter.Pane defaultSize={62} min="420px" className={classes.splitterPane}>
        {chatColumn}
      </Splitter.Pane>
      <Splitter.Pane
        defaultSize={38}
        min="360px"
        collapsible
        collapseThreshold="240px"
        className={classes.splitterPane}
      >
        <Inspector kind={inspector} />
      </Splitter.Pane>
    </Splitter>
  );
}
