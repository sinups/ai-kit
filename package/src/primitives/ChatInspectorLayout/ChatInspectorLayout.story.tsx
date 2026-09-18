import React, { useState } from 'react';
import { ActionIcon, Box } from '@mantine/core';
import { IconGitBranch, IconLayoutSidebarRight, IconListCheck } from '@tabler/icons-react';
import { AgentChat } from '../../AgentChat/AgentChat';
import { ChatHeader } from '../../ChatHeader/ChatHeader';
import { DiffReview } from '../../diff/DiffReview/DiffReview';
import { DIFF_FIXTURES } from '../../diff/fixtures';
import { conversation } from '../../MessageList/fixtures';
import { BackgroundTasksPanel } from '../../tasks/BackgroundTasksPanel/BackgroundTasksPanel';
import { createTaskFixtures } from '../../tasks/fixtures';
import { ChatInspectorLayout } from './ChatInspectorLayout';

export default { title: 'primitives/ChatInspectorLayout', parameters: { layout: 'fullscreen' } };

function Frame({ compact = false }: { compact?: boolean }) {
  const [opened, setOpened] = useState(!compact);
  const [tasks] = useState(() => createTaskFixtures());

  return (
    <Box h="100dvh" display="flex" style={{ flexDirection: 'column', minHeight: 0 }}>
      <ChatInspectorLayout
        compact={compact}
        opened={opened}
        onOpenedChange={setOpened}
        panels={[
          {
            id: 'changes',
            label: 'Changes',
            icon: <IconGitBranch size={16} />,
            content: <DiffReview changes={DIFF_FIXTURES} withHotkeys={false} header="Changes" />,
          },
          {
            id: 'tasks',
            label: 'Tasks',
            icon: <IconListCheck size={16} />,
            content: <BackgroundTasksPanel tasks={tasks} header="Background tasks" />,
          },
        ]}
      >
        <ChatHeader
          title="Add retry to token refresh"
          rightSection={
            <ActionIcon
              variant="subtle"
              color="gray"
              aria-label="Toggle inspector"
              onClick={() => setOpened((current) => !current)}
            >
              <IconLayoutSidebarRight size={18} />
            </ActionIcon>
          }
        />
        <AgentChat
          messages={conversation}
          status="ready"
          onSend={() => {}}
          onStop={() => {}}
          contentWidth={760}
          alignComposer
          topFade
          style={{ flex: 1, minHeight: 0 }}
        />
      </ChatInspectorLayout>
    </Box>
  );
}

export function Usage() {
  return <Frame />;
}

export function Compact() {
  return <Frame compact />;
}
