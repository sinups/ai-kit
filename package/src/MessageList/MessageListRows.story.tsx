import React from 'react';
import { Paper } from '@mantine/core';
import type { ChatMessage, ToolPart } from '../types';
import { MessageList } from './MessageList';

export default { title: 'MessageList/rows' };

function Frame({ width = 520, children }: { width?: number; children: React.ReactNode }) {
  return (
    <Paper
      withBorder
      radius={0}
      style={{
        height: '80vh',
        width,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {children}
    </Paper>
  );
}

const readCall: ToolPart = {
  type: 'tool-Read',
  toolCallId: 'r1',
  state: 'output-available',
  input: { file_path: 'src/app.ts' },
  output: 'export const app = createApp();\nexport default app;',
};

const taskList: ToolPart = {
  type: 'tool-mcp__layers__task_list',
  toolCallId: 'm1',
  state: 'output-available',
  input: { overdue: true, workspace: 'Layers', limit: 20 },
  output:
    'Перенести сборку на oxlint — просрочена на 4 дня\nОбновить лицензии — просрочена на 2 дня\nПочистить старые ветки — просрочена на 1 день\nСверить бюджеты бандла — просрочена на 1 день\nПроверить фикстуры — просрочена сегодня',
};

function turn(parts: Array<ToolPart | { type: 'text'; text: string }>): ChatMessage[] {
  return [
    {
      id: 'u1',
      role: 'user',
      parts: [{ type: 'text', text: 'Найди просроченные задачи и собери из них одну задачу.' }],
    },
    { id: 'a1', role: 'assistant', parts },
  ] as ChatMessage[];
}

const conversation = turn([
  { type: 'text', text: 'Сначала посмотрю, что просрочено в рабочем пространстве.' },
  readCall,
  taskList,
  { type: 'text', text: 'Нашёл **5 просроченных задач**. Собираю из них одну со списком.' },
]);

const series = turn([
  { type: 'text', text: 'Проверю несколько файлов подряд.' },
  readCall,
  {
    type: 'tool-Grep',
    toolCallId: 'g1',
    state: 'output-available',
    input: { pattern: 'createApp', path: 'src' },
    output: 'src/app.ts:1\nsrc/main.ts:12',
  },
  {
    type: 'tool-Bash',
    toolCallId: 'b1',
    state: 'output-available',
    input: { command: 'yarn oxlint' },
    output: { stdout: 'Found 0 warnings and 0 errors.', exitCode: 0 },
  },
  {
    type: 'tool-Edit',
    toolCallId: 'e1',
    state: 'output-available',
    input: {
      file_path: 'src/app.ts',
      old_string: 'export default app;',
      new_string: 'export default withRetry(app);\nexport const retries = 3;',
    },
    output: {},
  },
  taskList,
]);

export function Usage() {
  return (
    <Frame>
      <MessageList
        messages={conversation}
        status="ready"
        presentation="rows"
        initialScrollBehavior="top"
      />
    </Frame>
  );
}

export function Series() {
  return (
    <Frame>
      <MessageList
        messages={series}
        status="ready"
        presentation="rows"
        initialScrollBehavior="top"
      />
    </Frame>
  );
}

export function Narrow() {
  return (
    <Frame width={390}>
      <MessageList
        messages={series}
        status="ready"
        presentation="rows"
        initialScrollBehavior="top"
      />
    </Frame>
  );
}

export function Error() {
  return (
    <Frame>
      <MessageList
        messages={turn([
          { type: 'text', text: 'Запускаю сборку.' },
          {
            type: 'tool-Bash',
            toolCallId: 'b2',
            state: 'output-error',
            input: { command: 'yarn build' },
            errorText:
              'error TS2322: Type string is not assignable to type number.\n  src/app.ts:14:3\n  src/app.ts:18:7\nBuild failed with 3 errors.',
          },
        ])}
        status="ready"
        presentation="rows"
        initialScrollBehavior="top"
      />
    </Frame>
  );
}

export function Rejected() {
  return (
    <Frame>
      <MessageList
        messages={turn([
          { type: 'text', text: 'Хочу удалить каталог сборки.' },
          {
            type: 'tool-Bash',
            toolCallId: 'b3',
            state: 'output-error',
            input: { command: 'rm -rf build' },
            errorText: 'Rejected by the user',
          },
        ])}
        status="ready"
        presentation="rows"
        initialScrollBehavior="top"
      />
    </Frame>
  );
}

export function AwaitingPermission() {
  return (
    <Frame>
      <MessageList
        messages={turn([
          { type: 'text', text: 'Нужно почистить каталог сборки.' },
          {
            type: 'tool-Bash',
            toolCallId: 'b4',
            state: 'input-available',
            input: { command: 'rm -rf build', approval: { decision: null } },
          },
          {
            type: 'tool-Read',
            toolCallId: 'r9',
            state: 'input-available',
            input: { file_path: 'src/queued.ts' },
          },
        ])}
        status="streaming"
        presentation="rows"
        initialScrollBehavior="top"
      />
    </Frame>
  );
}

export function LongOutput() {
  return (
    <Frame>
      <MessageList
        messages={turn([
          { type: 'text', text: 'Покажу содержимое каталога.' },
          {
            type: 'tool-Bash',
            toolCallId: 'b5',
            state: 'output-available',
            input: { command: 'ls -la packages/shared/src/components' },
            output: {
              stdout: Array.from({ length: 24 }, (_, index) => `component-${index + 1}.tsx`).join(
                '\n'
              ),
              exitCode: 0,
            },
          },
        ])}
        status="ready"
        presentation="rows"
        initialScrollBehavior="top"
      />
    </Frame>
  );
}

export function Working() {
  return (
    <Frame>
      <MessageList
        messages={turn([
          { type: 'text', text: 'Сначала посмотрю, что просрочено.' },
          { ...taskList, state: 'input-available', output: undefined },
        ])}
        status="streaming"
        presentation="rows"
        workingRow
        toolActivity
        initialScrollBehavior="top"
      />
    </Frame>
  );
}

Working.parameters = { visual: { skip: true } };
