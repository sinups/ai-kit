import type { TodoItem } from './TodoTool';
import {
  DEFAULT_TODO_LABELS,
  describeHiddenTodos,
  getTodoBlockers,
  limitTodos,
} from './todo-utils';

const TODOS: TodoItem[] = [
  { id: 'a', content: 'Read', status: 'completed' },
  { id: 'b', content: 'Port', status: 'in_progress' },
  { id: 'c', content: 'Stories', status: 'pending', blockedBy: ['b', 'a'] },
  { id: 'd', content: 'Tests', status: 'pending', blockedBy: ['x'] },
  { id: 'e', content: 'Lint', status: 'in_progress' },
];

describe('tools/todo-utils', () => {
  it('keeps in-progress items first but preserves the original order', () => {
    const { visible, hidden } = limitTodos(TODOS, 3);
    expect(visible.map((item) => item.todo.id)).toEqual(['b', 'c', 'e']);
    expect(hidden).toEqual({ inProgress: 0, pending: 1, completed: 1 });
    expect(describeHiddenTodos(hidden, DEFAULT_TODO_LABELS)).toBe('+1 pending, 1 completed');
    expect(limitTodos(TODOS, 0).visible).toHaveLength(5);
    expect(describeHiddenTodos(limitTodos(TODOS, 10).hidden, DEFAULT_TODO_LABELS)).toBe('');
  });

  it('resolves unfinished blockers', () => {
    const blockers = getTodoBlockers(TODOS);
    expect(blockers.get(TODOS[2])).toEqual(['Port']);
    expect(blockers.get(TODOS[3])).toEqual(['x']);
    expect(blockers.get(TODOS[0])).toEqual([]);
    expect(blockers.get(TODOS[0])).toBe(blockers.get(TODOS[4]));
  });
});
