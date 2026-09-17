import React, { Fragment, memo, useMemo } from 'react';
import { Badge, Button, Loader, type MantineColor } from '@mantine/core';
import {
  describeTaskSummary,
  DEFAULT_BACKGROUND_TASK_LABELS,
  flattenTaskTree,
  summarizeTasks,
} from '../task-utils';
import type { BackgroundTask, BackgroundTaskLabels, BackgroundTaskSummary } from '../types';
import classes from './TaskStatusPill.module.css';

export interface TaskStatusPillProps {
  /** Tasks to summarize, nested `children` included */
  tasks?: BackgroundTask[];
  /** Counts subtasks from `children` as well as top-level tasks, `true` by default */
  countSubtasks?: boolean;
  /** Precomputed summary, takes precedence over `tasks` */
  summary?: BackgroundTaskSummary;
  /** Called on click, renders the pill as a button when set */
  onOpen?: () => void;
  /** Renders `pillEmpty` instead of nothing when there are no tasks, `false` by default */
  showWhenEmpty?: boolean;
  /** Overrides of the default English labels */
  labels?: Partial<BackgroundTaskLabels>;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

function pickColor(summary: BackgroundTaskSummary): MantineColor {
  return summary.running > 0 || summary.queued > 0 ? 'blue' : 'gray';
}

/** Compact background task indicator for a status bar or header, for example `2 running · 1 failed` */
export const TaskStatusPill = memo(function TaskStatusPill({
  tasks,
  summary: summaryProp,
  countSubtasks = true,
  onOpen,
  showWhenEmpty = false,
  labels: labelsProp,
  className,
  style,
}: TaskStatusPillProps) {
  const labels = { ...DEFAULT_BACKGROUND_TASK_LABELS, ...labelsProp };
  const summary = useMemo(
    () =>
      summaryProp ?? summarizeTasks(countSubtasks ? flattenTaskTree(tasks ?? []) : (tasks ?? [])),
    [summaryProp, tasks, countSubtasks]
  );
  const parts = describeTaskSummary(summary, labels);

  if (parts.length === 0 && !showWhenEmpty) {
    return null;
  }

  const failedIndex = summary.failed > 0 ? parts.length - 1 : -1;
  const text =
    parts.length > 0 ? (
      <span>
        {parts.map((part, index) => (
          <Fragment key={part}>
            {index > 0 && ' · '}
            {index === failedIndex ? <span className={classes.failed}>{part}</span> : part}
          </Fragment>
        ))}
      </span>
    ) : (
      labels.pillEmpty
    );
  const color = pickColor(summary);
  const busy = summary.running > 0;

  if (onOpen) {
    return (
      <Button
        variant="light"
        color={color}
        size="compact-xs"
        radius="xl"
        onClick={onOpen}
        leftSection={busy ? <Loader size={10} color={color} aria-hidden /> : undefined}
        className={className}
        style={style}
        data-busy={busy || undefined}
      >
        {text}
      </Button>
    );
  }

  return (
    <Badge
      variant="light"
      color={color}
      size="sm"
      tt="none"
      leftSection={busy ? <Loader size={10} color={color} aria-hidden /> : undefined}
      className={className}
      style={style}
      role="status"
      data-busy={busy || undefined}
    >
      {text}
    </Badge>
  );
});

TaskStatusPill.displayName = 'TaskStatusPill';
