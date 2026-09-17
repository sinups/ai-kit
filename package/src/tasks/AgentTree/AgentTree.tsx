import React, { memo, useCallback, useMemo, useState } from 'react';
import {
  ActionIcon,
  Group,
  Stack,
  Text,
  Tree,
  useTree,
  type RenderTreeNodePayload,
  type TreeNodeData,
} from '@mantine/core';
import { IconChevronRight } from '@tabler/icons-react';
import { StatusBadge } from '../../primitives/StatusBadge/StatusBadge';
import { cx } from '../../utils/cx';
import { TaskElapsed, TaskKindIcon } from '../TaskMeta';
import {
  DEFAULT_BACKGROUND_TASK_LABELS,
  findTask,
  flattenTaskTree,
  getTaskStatusLabel,
  getTaskUiStatus,
} from '../task-utils';
import type { BackgroundTask, BackgroundTaskLabels } from '../types';
import classes from './AgentTree.module.css';

type TreeExpandedState = Record<string, boolean>;

export interface AgentTreeProps {
  /** Root tasks with nested `children` */
  tasks: BackgroundTask[];
  /** Id of the selected task */
  selectedId?: string | null;
  /** Called when a node is clicked or chosen with Enter */
  onSelect?: (task: BackgroundTask) => void;
  /** Ids of collapsed nodes when uncontrolled, every node is expanded by default */
  defaultCollapsedIds?: string[];
  /** Overrides of the default English labels */
  labels?: Partial<BackgroundTaskLabels>;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

function toTreeData(tasks: BackgroundTask[]): TreeNodeData[] {
  return tasks.map((task) => ({
    value: task.id,
    label: task.title,
    children: task.children?.length ? toTreeData(task.children) : undefined,
  }));
}

/** Tree of an agent and its subagents with status, last activity and live elapsed time */
export const AgentTree = memo(function AgentTree({
  tasks,
  selectedId,
  onSelect,
  defaultCollapsedIds,
  labels: labelsProp,
  className,
  style,
}: AgentTreeProps) {
  const labels = { ...DEFAULT_BACKGROUND_TASK_LABELS, ...labelsProp };
  const data = useMemo(() => toTreeData(tasks), [tasks]);
  const [collapsed, setCollapsed] = useState(() => new Set(defaultCollapsedIds));

  const expandedState = useMemo<TreeExpandedState>(() => {
    const state: TreeExpandedState = {};
    for (const task of flattenTaskTree(tasks)) {
      state[task.id] = !collapsed.has(task.id);
    }
    return state;
  }, [tasks, collapsed]);

  const selectedState = useMemo(() => (selectedId ? [selectedId] : []), [selectedId]);

  const handleExpandedChange = useCallback((state: TreeExpandedState) => {
    setCollapsed(
      new Set(
        Object.entries(state)
          .filter(([, expanded]) => !expanded)
          .map(([id]) => id)
      )
    );
  }, []);

  const tree = useTree({
    expandedState,
    onExpandedStateChange: handleExpandedChange,
    selectedState,
  });

  const select = (id: string | undefined) => {
    const task = findTask(tasks, id);
    if (task) {
      onSelect?.(task);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLUListElement>) => {
    const target = event.target as HTMLElement;
    if (event.key === 'Enter' && target.getAttribute('role') === 'treeitem') {
      event.preventDefault();
      select(target.dataset.value);
    }
  };

  const renderNode = ({
    node,
    expanded,
    hasChildren,
    selected,
    elementProps,
  }: RenderTreeNodePayload) => {
    const task = findTask(tasks, node.value);
    if (!task) {
      return null;
    }
    return (
      <Group
        {...elementProps}
        gap={6}
        wrap="nowrap"
        align="flex-start"
        className={cx(elementProps.className, classes.node)}
        data-selected={selected || undefined}
        onClick={(event: React.MouseEvent) => {
          elementProps.onClick(event);
          onSelect?.(task);
        }}
      >
        <ActionIcon
          variant="subtle"
          color="gray"
          size="sm"
          tabIndex={-1}
          aria-label={expanded ? labels.collapse : labels.expand}
          className={classes.toggle}
          data-hidden={!hasChildren || undefined}
          data-expanded={expanded || undefined}
          onClick={(event: React.MouseEvent) => {
            event.stopPropagation();
            tree.toggleExpanded(node.value);
          }}
        >
          <IconChevronRight size={14} />
        </ActionIcon>
        <TaskKindIcon kind={task.kind} size="sm" />
        <Stack gap={2} flex={1} miw={0}>
          <Group gap="xs" wrap="nowrap" justify="space-between">
            <Text size="sm" fw={500} truncate="end" miw={0}>
              {task.title}
            </Text>
            <Text component="span" size="xs" c="dimmed" className={classes.elapsed}>
              <TaskElapsed task={task} />
            </Text>
          </Group>
          <Group gap={6} wrap="nowrap" miw={0}>
            <StatusBadge
              variant="dot"
              size="xs"
              status={getTaskUiStatus(task.status)}
              label={getTaskStatusLabel(task.status, labels)}
            />
            {task.lastActivity && (
              <Text size="xs" c="dimmed" truncate="end" miw={0}>
                · {task.lastActivity}
              </Text>
            )}
          </Group>
        </Stack>
      </Group>
    );
  };

  return (
    <Tree
      data={data}
      tree={tree}
      expandOnClick={false}
      levelOffset="md"
      renderNode={renderNode}
      onKeyDown={handleKeyDown}
      aria-label={labels.subtasks}
      className={className}
      style={style}
    />
  );
});

AgentTree.displayName = 'AgentTree';
