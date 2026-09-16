import React, { memo, useMemo } from 'react';
import { Box } from '@mantine/core';
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
import classes from './TodoTool.module.css';

export type TodoItem = {
  /** Task text */
  content: string;
  status: 'pending' | 'in_progress' | 'completed';
  /** Present-tense form shown while the task is in progress */
  activeForm?: string;
};

export interface TodoToolProps {
  /** Tool part in AI SDK v5 shape: `{ type, toolCallId, state, input, output }` */
  part: ToolPart;
  /** Chat status from `useChat()`, used to tell a pending tool from an interrupted one */
  chatStatus?: string;
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

type ChangeType = 'creation' | 'single' | 'multiple';

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

function TodoStatusIcon({ status }: { status: TodoItem['status']; isPending?: boolean }) {
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
}: {
  todo: TodoItem;
  isPending: boolean;
}) {
  const dimmed = isPending || todo.status === 'completed' || todo.status === 'pending';
  return (
    <div className={classes.item}>
      <span className={classes.iconWrap}>
        <TodoStatusIcon status={todo.status} isPending={isPending} />
      </span>
      <span
        className={classes.text}
        data-completed={todo.status === 'completed' || undefined}
        data-dimmed={dimmed || undefined}
      >
        {todo.content}
      </span>
    </div>
  );
});

/** Renders a `tool-TodoWrite` part as a checklist */
export const TodoTool = memo(function TodoTool({
  part,
  chatStatus,
  className,
  style,
}: TodoToolProps) {
  const { isPending } = getToolStatus(part, chatStatus);
  const input = getPartInput(part);
  const output = getPartOutput(part);

  const isStreaming = part.state === 'input-streaming';
  const oldTodos: TodoItem[] = output?.oldTodos || [];
  const newTodos: TodoItem[] = input.todos || output?.newTodos || [];

  const isCreation = oldTodos.length === 0;
  const changes = useMemo(() => detectChanges(oldTodos, newTodos), [oldTodos, newTodos]);

  if (isStreaming || newTodos.length === 0) {
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
      {newTodos.map((todo, idx) => (
        <TodoListItem key={idx} todo={todo} isPending={isPending} />
      ))}
    </Box>
  );
}, areToolPropsEqual);
