import React, { memo, useMemo } from 'react';
import { Box, Drawer, Group, Text } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { TaskStatusPill } from '../TaskStatusPill/TaskStatusPill';
import { DEFAULT_TASK_LABELS } from '../task-utils';
import { BackgroundTasksPanel, type BackgroundTasksPanelProps } from './BackgroundTasksPanel';
import classes from './BackgroundTasksPanel.module.css';
import { OVERLAY_INNER_CLASS } from '../../styles/overlay';

export interface BackgroundTasksDrawerProps extends BackgroundTasksPanelProps {
  /** Whether the drawer is open */
  opened: boolean;
  /** Called when the drawer requests to close */
  onClose: () => void;
  /** Drawer title, `labels.title` by default; the status pill sits next to it when wide and above the list when narrow */
  title?: React.ReactNode;
  /** Drawer width on wide screens, `720` by default */
  size?: number | string;
  /** Media query under which the drawer slides from the bottom and fills the screen, `(max-width: 48em)` by default */
  narrowQuery?: string;
}

/** `BackgroundTasksPanel` in a drawer: from the right on wide screens, full screen from the bottom on narrow ones */
export const BackgroundTasksDrawer = memo(function BackgroundTasksDrawer({
  opened,
  onClose,
  title,
  size = 720,
  narrowQuery = '(max-width: 48em)',
  className,
  style,
  ...panelProps
}: BackgroundTasksDrawerProps) {
  const labels = useMemo(
    () => ({ ...DEFAULT_TASK_LABELS, ...panelProps.labels }),
    [panelProps.labels]
  );
  const narrow = useMediaQuery(narrowQuery) ?? false;
  const pill = <TaskStatusPill tasks={panelProps.tasks} labels={panelProps.labels} />;

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      position={narrow ? 'bottom' : 'right'}
      size={narrow ? '100%' : size}
      title={
        title ??
        (narrow ? (
          <Text size="sm" fw={500} truncate="end">
            {labels.title}
          </Text>
        ) : (
          <Group gap="sm" wrap="nowrap" miw={0}>
            <Text size="sm" fw={500} truncate="end" miw={0}>
              {labels.title}
            </Text>
            {pill}
          </Group>
        ))
      }
      classNames={{
        inner: OVERLAY_INNER_CLASS,
        content: classes.drawerContent,
        body: classes.drawerBody,
      }}
      className={className}
      style={style}
    >
      {narrow && title === undefined && (
        <Box px="md" pb="xs">
          {pill}
        </Box>
      )}
      <Box className={classes.drawerPanel}>
        <BackgroundTasksPanel searchAutofocus {...panelProps} />
      </Box>
    </Drawer>
  );
});

BackgroundTasksDrawer.displayName = 'BackgroundTasksDrawer';
