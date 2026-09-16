import React from 'react';
import { Stack } from '@mantine/core';
import { TodoTool, type TodoItem } from './TodoTool';

export default { title: 'tools/TodoTool' };

const todos: TodoItem[] = [
  { content: 'Read the brief and foundation files', status: 'completed' },
  {
    content: 'Port tool cards to Mantine',
    status: 'in_progress',
    activeForm: 'Porting tool cards',
  },
  { content: 'Write stories and tests', status: 'pending' },
  { content: 'Run lint, format and typecheck', status: 'pending' },
];

export function Usage() {
  return (
    <Stack p={40} maw={420} gap={32}>
      <TodoTool
        part={{ type: 'tool-TodoWrite', toolCallId: 't1', state: 'input-streaming', input: {} }}
        chatStatus="streaming"
      />
      <TodoTool
        part={{
          type: 'tool-TodoWrite',
          toolCallId: 't2',
          state: 'input-available',
          input: { todos },
        }}
        chatStatus="streaming"
      />
      <TodoTool
        part={{
          type: 'tool-TodoWrite',
          toolCallId: 't3',
          state: 'output-available',
          input: { todos },
          output: { oldTodos: todos.map((t) => ({ ...t, status: 'pending' })), newTodos: todos },
        }}
        chatStatus="ready"
      />
      <TodoTool
        part={{
          type: 'tool-TodoWrite',
          toolCallId: 't4',
          state: 'input-available',
          input: { todos: [] },
          output: { oldTodos: todos },
        }}
        chatStatus="ready"
      />
    </Stack>
  );
}
