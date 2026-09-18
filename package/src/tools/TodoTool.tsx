import React, { memo, useMemo, useState } from 'react';
import { Badge, Box, Button, Group, Text, type MantineColor } from '@mantine/core';
import { CheckIcon, IconArrowRight } from '../icons';
import { TextShimmer } from '../TextShimmer/TextShimmer';
import type { ToolPart } from '../types';
import { cx } from '../utils/cx';
import {
  areToolPropsEqual,
  getPartInput,
  getPartOutput,
  getToolStatus,
} from '../utils/format-tool';
import {
  DEFAULT_TODO_TOOL_LABELS,
  describeHiddenTodos,
  getTodoBlockers,
  limitTodos,
  type TodoToolLabels,
} from './todo-utils';
import classes from './TodoTool.module.css';

export type TodoItem = {
  /** Task text */
  content: string;
  status: 'pending' | 'in_progress' | 'completed';
  /** Present-tense form shown while the task is in progress */
  activeForm?: string;
  /** Stable id other todos refer to in `blockedBy` */
  id?: string;
  /** Ids of todos that must be completed first */
  blockedBy?: string[];
  /** Agent or teammate working on the todo */
  owner?: { name: string; color?: MantineColor };
};

export interface TodoToolProps {
  /** Tool part in AI SDK v5 shape: `{ type, toolCallId, state, input, output }` */
  part: ToolPart;
  /** Chat status from `useChat()`, used to tell a pending tool from an interrupted one */
  chatStatus?: string;
  /** Shows at most this many todos, in-progress first, with a summary of the rest */
  maxVisible?: number;
  /** Overrides of the default English labels */
  labels?: Partial<TodoToolLabels>;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

export type TodoChange = {
  todo: TodoItem;
  oldStatus?: TodoItem['status'];
  newStatus: TodoItem['status'];
  index: number;
};

export type ChangeType = 'creation' | 'single' | 'multiple';

export type DetectedChanges = {
  type: ChangeType;
  items: TodoChange[];
};

function detectChanges(oldTodos: TodoItem[], newTodos: TodoItem[]): DetectedChanges {
  if (!oldTodos || oldTodos.length === 0) {
    return {
      type: 'creation',
      items: newTodos.map((todo, index) => ({ todo, newStatus: todo.status, index })),
    };
  }

  const changes: TodoChange[] = [];
  newTodos.forEach((newTodo, index) => {
    const oldTodo = oldTodos[index];
    if (!oldTodo || oldTodo.status !== newTodo.status) {
      changes.push({
        todo: newTodo,
        oldStatus: oldTodo?.status,
        newStatus: newTodo.status,
        index,
      });
    }
  });

  if (changes.length === 1) {
    return { type: 'single', items: changes };
  }
  return { type: 'multiple', items: changes };
}

function TodoStatusIcon({ status }: { status: TodoItem['status'] }) {
  switch (status) {
    case 'completed':
      return (
        <span className={classes.statusIcon} data-status="completed">
          <CheckIcon size={8} className={classes.statusGlyph} />
        </span>
      );
    case 'in_progress':
      return (
        <span className={classes.statusIcon}>
          <IconArrowRight size={8} className={classes.statusGlyph} />
        </span>
      );
    default:
      return <span className={classes.statusIcon} />;
  }
}

const TodoListItem = memo(function TodoListItem({
  todo,
  isPending,
  blockers,
  blockedByLabel,
}: {
  todo: TodoItem;
  isPending: boolean;
  blockers: string[];
  blockedByLabel: string;
}) {
  const dimmed = isPending || todo.status === 'completed' || todo.status === 'pending';
  return (
    <div className={classes.item}>
      <span className={classes.iconWrap}>
        <TodoStatusIcon status={todo.status} />
      </span>
      <span className={classes.body}>
        <span
          className={classes.text}
          data-completed={todo.status === 'completed' || undefined}
          data-dimmed={dimmed || undefined}
        >
          {todo.content}
        </span>
        {todo.owner && (
          <Badge
            size="xs"
            variant="dot"
            color={todo.owner.color ?? 'gray'}
            tt="none"
            className={classes.owner}
          >
            {todo.owner.name}
          </Badge>
        )}
        {blockers.length > 0 && (
          <Text span size="xs" c="dimmed" className={classes.blocked}>
            {blockedByLabel} {blockers.join(', ')}
          </Text>
        )}
      </span>
    </div>
  );
});

function firstNonEmptyList(...candidates: unknown[]): TodoItem[] {
  for (const candidate of candidates) {
    if (Array.isArray(candidate) && candidate.length > 0) {
      return candidate as TodoItem[];
    }
  }
  return [];
}

/** Renders a `tool-TodoWrite` part as a checklist */
export const TodoTool = memo(function TodoTool({
  part,
  chatStatus,
  maxVisible = 0,
  labels: labelsProp,
  className,
  style,
}: TodoToolProps) {
  const labels = { ...DEFAULT_TODO_TOOL_LABELS, ...labelsProp };
  const [showAll, setShowAll] = useState(false);
  const { isPending } = getToolStatus(part, chatStatus);
  const input = getPartInput(part);
  const output = getPartOutput(part);

  const isStreaming = part.state === 'input-streaming';
  const oldTodos: TodoItem[] = output?.oldTodos || [];
  const newTodos: TodoItem[] = firstNonEmptyList(input.todos, output?.newTodos);

  const isCreation = oldTodos.length === 0;
  const changes = useMemo(() => detectChanges(oldTodos, newTodos), [oldTodos, newTodos]);
  const limited = useMemo(
    () => limitTodos(newTodos, showAll ? 0 : maxVisible),
    [newTodos, maxVisible, showAll]
  );
  const blockers = useMemo(() => getTodoBlockers(newTodos), [newTodos]);
  const canToggle = maxVisible > 0 && newTodos.length > maxVisible;
  const hiddenText = describeHiddenTodos(limited.hidden, labels);

  if (!isStreaming && part.state === 'output-available' && newTodos.length === 0) {
    return null;
  }

  if (newTodos.length === 0) {
    return (
      <Box className={cx(classes.root, className)} style={style}>
        <div className={classes.placeholder}>
          <TextShimmer as="span" duration={1.2} className={classes.shimmer}>
            {isCreation ? 'Creating to-do list...' : 'Updating to-dos...'}
          </TextShimmer>
        </div>
      </Box>
    );
  }

  return (
    <Box className={cx(classes.root, className)} style={style} data-change-type={changes.type}>
      {limited.visible.map(({ todo, index }) => (
        <TodoListItem
          key={todo.id ?? `idx-${index}`}
          todo={todo}
          isPending={isPending}
          blockers={blockers.get(todo) ?? []}
          blockedByLabel={labels.blockedBy}
        />
      ))}
      {canToggle && (
        <Group gap={10} wrap="nowrap" className={classes.hidden}>
          {hiddenText && (
            <Text size="xs" c="dimmed">
              {hiddenText}
            </Text>
          )}
          <Button
            variant="subtle"
            color="gray"
            size="compact-xs"
            onClick={() => setShowAll((value) => !value)}
          >
            {showAll ? labels.showLess : labels.showAll}
          </Button>
        </Group>
      )}
    </Box>
  );
}, areToolPropsEqual);

TodoTool.displayName = 'TodoTool';
