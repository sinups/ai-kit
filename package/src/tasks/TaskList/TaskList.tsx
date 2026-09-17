import React, { memo, useCallback, useMemo, useRef, useState } from 'react';
import { Alert, Button, Group, Progress, Select, Stack, Text } from '@mantine/core';
import {
  IconAlertCircle,
  IconPlayerStop,
  IconRefresh,
  IconSitemap,
  IconTrash,
} from '@tabler/icons-react';
import { CompactSearch } from '../../primitives/CompactSearch/CompactSearch';
import { EntityList, type EntityListFilterOption } from '../../primitives/EntityList/EntityList';
import {
  EntityListItem,
  type EntityListItemAction,
} from '../../primitives/EntityList/EntityListItem';
import { StatusBadge } from '../../primitives/StatusBadge/StatusBadge';
import { TaskElapsed, TaskKindIcon } from '../TaskMeta';
import {
  BACKGROUND_TASK_KINDS,
  canRetryTask,
  canStopTask,
  countTasksByKind,
  DEFAULT_TASK_LABELS,
  getProgressPercent,
  describeHiddenTasks,
  getOpenBlockers,
  getTaskGroup,
  isRecentlyCompleted,
  limitTasks,
  RECENT_COMPLETION_MS,
  getTaskKindLabel,
  getTaskStatusLabel,
  getTaskUiStatus,
  matchesTaskQuery,
} from '../task-utils';
import type { BackgroundTask, BackgroundTaskLabels } from '../types';
import { useOverlayAutofocus } from '../../hooks/use-overlay-autofocus';
import { usePendingActions } from '../../hooks/use-pending-actions';
import { useNow } from '../use-now';
import { cx } from '../../utils/cx';
import classes from './TaskList.module.css';

export type TaskAction = (task: BackgroundTask) => void | Promise<void>;

export interface TaskListProps {
  /** Top-level tasks, subtasks are counted on the row and shown in `TaskDetail` */
  tasks: BackgroundTask[];
  /** Id of the selected task */
  selectedId?: string | null;
  /** Called when a task is clicked or chosen with Enter */
  onSelect?: (task: BackgroundTask) => void;
  /** Stops a queued or running task, the action is shown only when set */
  onStop?: TaskAction;
  /** Retries a failed or cancelled task, the action is shown only when set */
  onRetry?: TaskAction;
  /** Removes a finished task from the list, the action is shown only when set */
  onRemove?: TaskAction;
  /** Shows skeleton rows */
  loading?: boolean;
  /** Error message shown instead of the list */
  error?: React.ReactNode;
  /** Called by the retry button of the error alert */
  onRetryLoad?: () => void;
  /** Shows the search input, `true` by default */
  withSearch?: boolean;
  /** Marks the search input with `data-autofocus` so an enclosing Drawer or Modal focuses it on open */
  searchAutofocus?: boolean;
  /** One ghost toolbar row: search behind an icon and the kind filter without a border */
  compact?: boolean;
  /** Shows the kind filter when tasks have more than one kind, `true` by default */
  withKindFilter?: boolean;
  /** Shows at most this many tasks, running first, with a summary of the rest and a Show all button; ignored while searching */
  maxVisible?: number;
  /** Tasks completed within this many ms are highlighted, `30000` by default; `0` turns it off */
  recentWindowMs?: number;
  /** Overrides of the default English labels */
  labels?: Partial<BackgroundTaskLabels>;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

const ALL_KINDS = 'all';

/** Background tasks grouped into Running, Queued and Finished with live elapsed time and actions */
export const TaskList = memo(function TaskList({
  tasks,
  selectedId,
  onSelect,
  onStop,
  onRetry,
  onRemove,
  loading,
  error,
  onRetryLoad,
  withSearch = true,
  searchAutofocus = false,
  withKindFilter = true,
  compact = false,
  maxVisible,
  recentWindowMs = RECENT_COMPLETION_MS,
  labels: labelsProp,
  className,
  style,
}: TaskListProps) {
  const labels = useMemo(() => ({ ...DEFAULT_TASK_LABELS, ...labelsProp }), [labelsProp]);
  const [query, setQuery] = useState('');
  const [selectedKind, setKind] = useState(ALL_KINDS);
  const [showAll, setShowAll] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const actions = usePendingActions();
  const rootRef = useRef<HTMLDivElement>(null);

  useOverlayAutofocus(rootRef, searchAutofocus);

  const kindOptions = useMemo<EntityListFilterOption[]>(() => {
    const counts = countTasksByKind(tasks);
    const present = BACKGROUND_TASK_KINDS.filter((item) => counts[item] > 0);
    if (present.length < 2) {
      return [];
    }
    return [
      { value: ALL_KINDS, label: labels.kindAll, count: tasks.length },
      ...present.map((item) => ({
        value: item,
        label: getTaskKindLabel(item, labels),
        count: counts[item],
      })),
    ];
  }, [tasks, labels]);
  const kind =
    withKindFilter && kindOptions.some((option) => option.value === selectedKind)
      ? selectedKind
      : ALL_KINDS;

  const filtered = useMemo(
    () =>
      tasks.filter(
        (task) => (kind === ALL_KINDS || task.kind === kind) && matchesTaskQuery(task, query)
      ),
    [tasks, kind, query]
  );

  const limit = maxVisible && maxVisible > 0 && !query.trim() ? maxVisible : 0;
  const limited = useMemo(
    () => (limit && !showAll ? limitTasks(filtered, limit) : null),
    [filtered, limit, showAll]
  );
  const hiddenText = limited ? describeHiddenTasks(limited.hidden, labels) : '';

  const hasRecent =
    recentWindowMs > 0 &&
    tasks.some((task) => isRecentlyCompleted(task, Date.now(), recentWindowMs));
  const now = useNow(hasRecent);

  const groupLabel = useCallback(
    (task: BackgroundTask) => {
      const group = getTaskGroup(task.status);
      if (group === 'running') {
        return labels.groupRunning;
      }
      return group === 'queued' ? labels.groupQueued : labels.groupFinished;
    },
    [labels]
  );

  const groupOrder = useMemo(
    () => [labels.groupRunning, labels.groupQueued, labels.groupFinished],
    [labels]
  );

  const getActions = (task: BackgroundTask): EntityListItemAction[] => {
    const items: EntityListItemAction[] = [];
    if (onStop && canStopTask(task)) {
      items.push({
        label: labels.stop,
        icon: <IconPlayerStop size={14} />,
        color: 'red',
        disabled: actions.isPending(`stop:${task.id}`),
        onClick: () => actions.run(`stop:${task.id}`, () => onStop(task)),
      });
    }
    if (onRetry && canRetryTask(task)) {
      items.push({
        label: labels.retry,
        icon: <IconRefresh size={14} />,
        disabled: actions.isPending(`retry:${task.id}`),
        onClick: () => actions.run(`retry:${task.id}`, () => onRetry(task)),
      });
    }
    if (onRemove && !canStopTask(task)) {
      items.push({
        label: labels.remove,
        icon: <IconTrash size={14} />,
        color: 'red',
        disabled: actions.isPending(`remove:${task.id}`),
        onClick: () => actions.run(`remove:${task.id}`, () => onRemove(task)),
      });
    }
    return items;
  };

  return (
    <Stack
      ref={rootRef}
      gap="xs"
      tabIndex={compact && searchAutofocus ? -1 : undefined}
      data-autofocus={(compact && searchAutofocus) || undefined}
      className={cx(classes.focusTarget, className)}
      style={style}
    >
      {actions.error && (
        <Alert
          color="red"
          variant="light"
          icon={<IconAlertCircle size={16} />}
          withCloseButton
          closeButtonLabel={labels.dismiss}
          onClose={() => actions.clearError()}
        >
          {actions.error}
        </Alert>
      )}
      {compact && (withSearch || (withKindFilter && kindOptions.length > 0)) && (
        <Group gap={4} wrap="nowrap" mih={30}>
          {withSearch && (
            <CompactSearch
              opened={searchOpen}
              onOpen={() => setSearchOpen(true)}
              onClose={() => {
                setQuery('');
                setSearchOpen(false);
              }}
              value={query}
              onChange={setQuery}
              label={labels.search}
              closeLabel={labels.closeSearch}
            />
          )}
          {!(withSearch && searchOpen) && <Group flex={1} />}
          {withKindFilter && kindOptions.length > 0 && (
            <Select
              size="xs"
              variant="unstyled"
              w={120}
              aria-label={labels.kindFilter}
              allowDeselect={false}
              value={kind}
              onChange={(value) => value && setKind(value)}
              data={kindOptions.map((option) => ({
                value: option.value,
                label: `${option.label} (${option.count})`,
              }))}
              classNames={{ input: classes.ghostSelect }}
            />
          )}
        </Group>
      )}
      <EntityList<BackgroundTask>
        items={limited ? limited.visible : filtered}
        getId={(task) => task.id}
        selectedId={selectedId}
        onSelect={onSelect}
        loading={loading}
        error={error}
        onRetry={onRetryLoad}
        retryLabel={labels.loadRetry}
        ariaLabel={labels.title}
        empty={
          compact && query.trim()
            ? undefined
            : { title: labels.emptyTitle, description: labels.emptyDescription }
        }
        noResults={labels.noResults}
        search={
          withSearch && !compact
            ? {
                value: query,
                onChange: setQuery,
                placeholder: labels.search,
                dataAutofocus: searchAutofocus && !compact,
              }
            : undefined
        }
        filters={
          withKindFilter && !compact && kindOptions.length > 0
            ? {
                value: kind,
                onChange: setKind,
                options: kindOptions,
                label: labels.kindFilter,
              }
            : undefined
        }
        groupBy={groupLabel}
        groupOrder={groupOrder}
        renderItem={(task, { selected }) => {
          const childCount = task.children?.length ?? 0;
          const blockers =
            getTaskGroup(task.status) === 'finished' ? [] : getOpenBlockers(task, tasks);
          const recent = recentWindowMs > 0 && isRecentlyCompleted(task, now, recentWindowMs);
          return (
            <EntityListItem
              selected={selected}
              className={cx(classes.task, recent && classes.recent)}
              icon={<TaskKindIcon kind={task.kind} />}
              title={task.title}
              description={
                <>
                  {task.owner && (
                    <>
                      <Text
                        span
                        inherit
                        fw={500}
                        c={`var(--mantine-color-${task.owner.color ?? 'gray'}-text)`}
                        data-owner={task.owner.name}
                      >
                        {task.owner.name}
                      </Text>
                      {' · '}
                    </>
                  )}
                  {blockers.length > 0
                    ? `${labels.blockedBy} ${blockers.join(', ')}`
                    : (task.lastActivity ?? task.description)}
                </>
              }
              descriptionLines={1}
              status={
                getTaskGroup(task.status) === 'finished' ? (
                  <StatusBadge
                    status={getTaskUiStatus(task.status)}
                    label={getTaskStatusLabel(task.status, labels)}
                    size="xs"
                  />
                ) : undefined
              }
              meta={
                <Stack gap={4} align="flex-end">
                  <Group gap={6} wrap="nowrap">
                    {childCount > 0 && (
                      <Group gap={2} wrap="nowrap" aria-label={`${childCount} ${labels.subtasks}`}>
                        <IconSitemap size={12} aria-hidden />
                        {childCount}
                      </Group>
                    )}
                    <TaskElapsed task={task} />
                  </Group>
                  {task.progress && (
                    <Progress
                      w={56}
                      size="xs"
                      value={getProgressPercent(task.progress)}
                      color={task.status === 'failed' ? 'red' : undefined}
                      aria-label={task.progress.label ?? task.title}
                    />
                  )}
                </Stack>
              }
              actions={getActions(task)}
              actionsLabel={labels.actions}
            />
          );
        }}
      />
      {limit > 0 && !loading && !error && (hiddenText || (showAll && filtered.length > limit)) && (
        <Group gap="xs" justify="space-between" wrap="nowrap" px="sm">
          <Text size="xs" c="dimmed" truncate>
            {hiddenText}
          </Text>
          <Button
            variant="subtle"
            color="gray"
            size="compact-xs"
            onClick={() => setShowAll((value) => !value)}
          >
            {showAll ? labels.showFewerTasks : labels.showAllTasks}
          </Button>
        </Group>
      )}
    </Stack>
  );
});

TaskList.displayName = 'TaskList';
