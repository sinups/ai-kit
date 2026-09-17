import React from 'react';
import { expect, userEvent, within } from '@storybook/test';
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

const TEAM_TODOS: TodoItem[] = [
  {
    id: 'brief',
    content: 'Read the brief',
    status: 'completed',
    owner: { name: 'lead', color: 'blue' },
  },
  {
    id: 'api',
    content: 'Add the discounts API',
    status: 'in_progress',
    owner: { name: 'backend', color: 'teal' },
  },
  {
    id: 'ui',
    content: 'Discount field in the invoice form',
    status: 'in_progress',
    owner: { name: 'ui', color: 'grape' },
  },
  { id: 'tests', content: 'Integration tests', status: 'pending', blockedBy: ['api', 'ui'] },
  { id: 'docs', content: 'Update API docs', status: 'pending', blockedBy: ['api'] },
  { id: 'deploy', content: 'Deploy preview', status: 'pending', blockedBy: ['tests'] },
  { id: 'lint', content: 'Fix lint warnings', status: 'completed' },
];

export function TeamWithLimit() {
  return (
    <Stack p={40} maw={420} gap={32}>
      <TodoTool
        part={{
          type: 'tool-TodoWrite',
          toolCallId: 'team',
          state: 'input-available',
          input: { todos: TEAM_TODOS },
        }}
      />
      <TodoTool
        maxVisible={3}
        part={{
          type: 'tool-TodoWrite',
          toolCallId: 'team-limited',
          state: 'input-available',
          input: { todos: TEAM_TODOS },
        }}
      />
    </Stack>
  );
}

export const MaxVisibleFlow = {
  render: () => (
    <Stack p={40} maw={420}>
      <TodoTool
        maxVisible={3}
        part={{
          type: 'tool-TodoWrite',
          toolCallId: 'team-flow',
          state: 'input-available',
          input: { todos: TEAM_TODOS },
        }}
      />
    </Stack>
  ),
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('+2 pending, 2 completed')).toBeInTheDocument();
    await expect(canvas.queryByText('Read the brief')).not.toBeInTheDocument();
    await expect(
      canvas.getByText('Blocked by Add the discounts API, Discount field in the invoice form')
    ).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: 'Show all' }));
    await expect(canvas.getByText('Read the brief')).toBeInTheDocument();
    await expect(canvas.getByText('Fix lint warnings')).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: 'Show less' }));
    await expect(canvas.queryByText('Read the brief')).not.toBeInTheDocument();
  },
};
