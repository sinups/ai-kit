import React, { useState } from 'react';
import { ActionIcon, Badge, Group, Switch, Tooltip } from '@mantine/core';
import { IconLayoutSidebar, IconLayoutSidebarRight, IconSettings } from '@tabler/icons-react';
import { NARROW_WIDTH, WIDE_WIDTH, WidthFrame } from '../_stories/WidthFrame';
import { ContextUsage } from '../ContextUsage/ContextUsage';
import { ChatHeader } from './ChatHeader';

export default { title: 'ChatHeader' };

function SidebarToggle() {
  return (
    <Tooltip label="Toggle the sidebar">
      <ActionIcon variant="subtle" color="gray" aria-label="Toggle the sidebar">
        <IconLayoutSidebar size={18} />
      </ActionIcon>
    </Tooltip>
  );
}

function PanelActions() {
  return (
    <>
      <Tooltip label="Settings">
        <ActionIcon variant="subtle" color="gray" aria-label="Settings">
          <IconSettings size={18} />
        </ActionIcon>
      </Tooltip>
      <Tooltip label="Toggle the inspector">
        <ActionIcon variant="subtle" color="gray" aria-label="Toggle the inspector">
          <IconLayoutSidebarRight size={18} />
        </ActionIcon>
      </Tooltip>
    </>
  );
}

export function Usage() {
  return (
    <WidthFrame width={WIDE_WIDTH}>
      <ChatHeader
        title="Flaky upload test"
        subtitle="claude-opus-5 · acme workspace"
        leftSection={<SidebarToggle />}
        secondarySection={
          <Badge size="sm" variant="light" color="teal">
            3 servers
          </Badge>
        }
        rightSection={<PanelActions />}
      />
    </WidthFrame>
  );
}

export function Narrow() {
  return (
    <WidthFrame width={NARROW_WIDTH}>
      <ChatHeader
        title="Flaky upload test in the release pipeline"
        subtitle="claude-opus-5 · acme workspace"
        leftSection={<SidebarToggle />}
        secondarySection={
          <Badge size="sm" variant="light" color="teal">
            3 servers
          </Badge>
        }
        rightSection={<PanelActions />}
      />
    </WidthFrame>
  );
}

export function WithBadges() {
  return (
    <WidthFrame width={WIDE_WIDTH}>
      <ChatHeader
        title="Migration review"
        leftSection={<SidebarToggle />}
        secondarySection={
          <Group gap={6}>
            <Badge size="sm" variant="light">
              Plan mode
            </Badge>
            <Badge size="sm" variant="light" color="orange">
              2 pending approvals
            </Badge>
          </Group>
        }
        rightSection={<PanelActions />}
      />
    </WidthFrame>
  );
}

export function WithContextUsage() {
  const [compact, setCompact] = useState(true);
  return (
    <WidthFrame width={WIDE_WIDTH}>
      <ChatHeader
        title="Migration review"
        subtitle="claude-opus-5"
        leftSection={<SidebarToggle />}
        rightSection={
          <Group gap="sm" wrap="nowrap">
            <Switch
              size="xs"
              checked={compact}
              onChange={(event) => setCompact(event.currentTarget.checked)}
              label="Auto-compact"
            />
            <ContextUsage used={128_000} total={200_000} />
            <PanelActions />
          </Group>
        }
      />
    </WidthFrame>
  );
}

export function TitleOnly() {
  return (
    <WidthFrame width={WIDE_WIDTH}>
      <ChatHeader title="New chat" />
    </WidthFrame>
  );
}
