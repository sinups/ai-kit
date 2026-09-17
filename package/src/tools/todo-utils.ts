import type { TodoItem } from './TodoTool';

export interface HiddenTodos {
  inProgress: number;
  pending: number;
  completed: number;
}

export interface TodoToolLabels {
  blockedBy: string;
  hiddenInProgress: string;
  hiddenPending: string;
  hiddenCompleted: string;
  showAll: string;
  showLess: string;
}

export const DEFAULT_TODO_TOOL_LABELS: TodoToolLabels = {
  blockedBy: 'Blocked by',
  hiddenInProgress: 'in progress',
  hiddenPending: 'pending',
  hiddenCompleted: 'completed',
  showAll: 'Show all',
  showLess: 'Show less',
};

const PRIORITY: TodoItem['status'][] = ['in_progress', 'pending', 'completed'];

/** At most `maxVisible` todos in their original order, picking in-progress first, then pending, then completed */
export function limitTodos(
  todos: TodoItem[],
  maxVisible: number
): { visible: { todo: TodoItem; index: number }[]; hidden: HiddenTodos } {
  const indexed = todos.map((todo, index) => ({ todo, index }));
  if (maxVisible <= 0 || todos.length <= maxVisible) {
    return { visible: indexed, hidden: { inProgress: 0, pending: 0, completed: 0 } };
  }
  const chosen = new Set(
    PRIORITY.flatMap((status) => indexed.filter((item) => item.todo.status === status))
      .slice(0, maxVisible)
      .map((item) => item.index)
  );
  const hidden: HiddenTodos = { inProgress: 0, pending: 0, completed: 0 };
  for (const item of indexed) {
    if (chosen.has(item.index)) {
      continue;
    }
    if (item.todo.status === 'in_progress') {
      hidden.inProgress++;
    } else if (item.todo.status === 'completed') {
      hidden.completed++;
    } else {
      hidden.pending++;
    }
  }
  return { visible: indexed.filter((item) => chosen.has(item.index)), hidden };
}

export function describeHiddenTodos(hidden: HiddenTodos, labels: TodoToolLabels): string {
  const parts = [
    hidden.inProgress > 0 ? `${hidden.inProgress} ${labels.hiddenInProgress}` : '',
    hidden.pending > 0 ? `${hidden.pending} ${labels.hiddenPending}` : '',
    hidden.completed > 0 ? `${hidden.completed} ${labels.hiddenCompleted}` : '',
  ].filter(Boolean);
  return parts.length > 0 ? `+${parts.join(', ')}` : '';
}

const NO_BLOCKERS: string[] = [];

/** Contents of unfinished todos each todo lists in `blockedBy`, matched by `id`; unknown ids are shown as is */
export function getTodoBlockers(todos: readonly TodoItem[]): Map<TodoItem, string[]> {
  const byId = new Map<string, TodoItem>();
  for (const todo of todos) {
    if (todo.id !== undefined) {
      byId.set(todo.id, todo);
    }
  }
  return new Map(
    todos.map((todo) => {
      const blockers = (todo.blockedBy ?? []).flatMap((id) => {
        const blocker = byId.get(id);
        return blocker?.status === 'completed' ? [] : [blocker?.content ?? id];
      });
      return [todo, blockers.length > 0 ? blockers : NO_BLOCKERS];
    })
  );
}
