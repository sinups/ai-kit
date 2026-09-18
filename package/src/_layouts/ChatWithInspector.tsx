import React, { useState } from 'react';
import { Box, Text } from '@mantine/core';
import { IconLayoutSidebarRight } from '@tabler/icons-react';
import { AgentChat } from '../AgentChat/AgentChat';
import { DiffReview } from '../diff/DiffReview/DiffReview';
import { DIFF_FIXTURES } from '../diff/fixtures';
import type { FileChange, FileDecision } from '../diff/types';
import { conversation } from '../MessageList/fixtures';
import { ChatInspectorLayout } from '../primitives/ChatInspectorLayout/ChatInspectorLayout';
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
    <>
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
    </>
  );
}

/** Chat next to a resizable, collapsible inspector (diff review or tasks); a bottom drawer on phones */
export function ChatWithInspector({
  compact = false,
  inspector = 'diff',
  defaultOpened = false,
}: ChatWithInspectorProps) {
  const chat = useLayoutChat(conversation);
  const [opened, setOpened] = useState(!compact || defaultOpened);

  const chatColumn = (
    <Box className={classes.chatColumn}>
      <LayoutHeader
        title="Add retry to token refresh"
        columnWidth={CHAT_WIDTH}
        action={{
          label: inspector === 'diff' ? 'Toggle changes' : 'Toggle tasks',
          icon: <IconLayoutSidebarRight size={18} />,
          onClick: () => setOpened((current) => !current),
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

  return (
    <ChatInspectorLayout
      compact={compact}
      opened={opened}
      onOpenedChange={setOpened}
      defaultSize={38}
      inspector={<Inspector kind={inspector} />}
    >
      {chatColumn}
    </ChatInspectorLayout>
  );
}
