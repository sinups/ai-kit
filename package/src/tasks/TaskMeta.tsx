import React, { memo } from 'react';
import { ThemeIcon, type MantineSize } from '@mantine/core';
import {
  IconCloud,
  IconRobot,
  IconTerminal2,
  IconTopologyStar3,
  type Icon,
} from '@tabler/icons-react';
import { formatElapsedTime } from '../utils/format-elapsed';
import { getTaskElapsedMs, toTimestamp } from './task-utils';
import type { BackgroundTask, BackgroundTaskKind } from './types';
import { useNow } from './use-now';

const KIND_ICONS: Record<BackgroundTaskKind, Icon> = {
  shell: IconTerminal2,
  agent: IconRobot,
  remote: IconCloud,
  workflow: IconTopologyStar3,
};

const ICON_SIZE: Record<MantineSize, number> = { xs: 12, sm: 14, md: 16, lg: 20, xl: 24 };

export interface TaskKindIconProps {
  /** Task kind that picks the icon */
  kind: BackgroundTaskKind;
  /** Icon container size, `md` by default */
  size?: MantineSize;
}

/** Icon of a background task kind in a light `ThemeIcon` */
export const TaskKindIcon = memo(function TaskKindIcon({ kind, size = 'md' }: TaskKindIconProps) {
  const KindIcon = KIND_ICONS[kind] ?? IconTerminal2;
  return (
    <ThemeIcon variant="light" color="gray" size={size} aria-hidden>
      <KindIcon size={ICON_SIZE[size]} />
    </ThemeIcon>
  );
});

TaskKindIcon.displayName = 'TaskKindIcon';

export interface TaskElapsedProps {
  /** Task whose `startedAt`/`endedAt` give the elapsed time */
  task: Pick<BackgroundTask, 'status' | 'startedAt' | 'endedAt'>;
}

/** Elapsed time of a task, ticking every second while it runs */
export const TaskElapsed = memo(function TaskElapsed({ task }: TaskElapsedProps) {
  const live = task.status === 'running' && toTimestamp(task.endedAt) === undefined;
  const now = useNow(live && toTimestamp(task.startedAt) !== undefined);
  const elapsedMs = getTaskElapsedMs(task, now);
  if (elapsedMs === undefined) {
    return null;
  }
  return <span data-live={live || undefined}>{formatElapsedTime(elapsedMs) || '0s'}</span>;
});

TaskElapsed.displayName = 'TaskElapsed';
