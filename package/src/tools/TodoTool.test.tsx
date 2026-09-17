import React from 'react';
import { render, screen } from '@mantine-tests/core';
import { TodoTool, type TodoItem } from './TodoTool';

const TODOS: TodoItem[] = [
  { id: 'read', content: 'Read the brief', status: 'completed' },
  {
    id: 'port',
    content: 'Port tool cards',
    status: 'in_progress',
    owner: { name: 'ui', color: 'grape' },
  },
  { id: 'stories', content: 'Write stories', status: 'pending', blockedBy: ['port'] },
  { id: 'lint', content: 'Run lint', status: 'pending' },
];

const part = (todos: TodoItem[]) => ({
  type: 'tool-TodoWrite',
  toolCallId: 't1',
  state: 'input-available' as const,
  input: { todos },
});

describe('tools/TodoTool', () => {
  it('renders every todo with owner and blockers', () => {
    render(<TodoTool part={part(TODOS)} />);
    expect(screen.getByText('Read the brief')).toBeInTheDocument();
    expect(screen.getByText('ui')).toBeInTheDocument();
    expect(screen.getByText('Blocked by Port tool cards')).toBeInTheDocument();
    expect(screen.queryByText(/^\+/)).not.toBeInTheDocument();
  });

  it('limits visible todos and summarizes the rest', () => {
    render(<TodoTool part={part(TODOS)} maxVisible={2} />);
    expect(screen.getByText('Port tool cards')).toBeInTheDocument();
    expect(screen.getByText('Write stories')).toBeInTheDocument();
    expect(screen.queryByText('Read the brief')).not.toBeInTheDocument();
    expect(screen.getByText('+1 pending, 1 completed')).toBeInTheDocument();
  });
});
