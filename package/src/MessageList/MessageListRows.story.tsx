import React from 'react';
import type { ChatMessage, ToolPart } from '../types';
import { MessageList } from './MessageList';
import { rowsPresentation } from '../rows/rows-presentation';

export default { title: 'MessageList/rows' };

function Feed({ width = 520, children }: { width?: number; children: React.ReactNode }) {
  return <div style={{ height: '80vh', width, margin: '0 auto', display: 'flex' }}>{children}</div>;
}

const workspaceContext: ToolPart = {
  type: 'tool-mcp__tracker__workspace_context',
  toolCallId: 'w1',
  state: 'output-available',
  input: {},
  output: 'Пространство Core, проект «Релиз 0.3», открыта страница «План недели»',
};

const taskList: ToolPart = {
  type: 'tool-mcp__tracker__task_list',
  toolCallId: 'm1',
  state: 'output-available',
  input: { overdue: true, workspace: 'Core', limit: 20 },
  output:
    'Перенести сборку на oxlint — просрочена на 4 дня\nОбновить лицензии — просрочена на 2 дня\nПочистить старые ветки — просрочена на 1 день\nСверить бюджеты бандла — просрочена на 1 день\nПроверить фикстуры — просрочена сегодня',
};

const taskCreate: ToolPart = {
  type: 'tool-mcp__tracker__task_create',
  toolCallId: 'm2',
  state: 'output-available',
  input: { project: 'Релиз 0.3', title: 'Разобрать просроченное', assignee: 'Sinups' },
  output: 'Создана задача TRK-482 «Разобрать просроченное»',
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
  workspaceContext,
  taskList,
  { type: 'text', text: 'Нашёл **5 просроченных задач**. Собираю из них одну со списком.' },
]);

const series = turn([
  { type: 'text', text: 'Пройдусь по пространству и соберу картину.' },
  workspaceContext,
  {
    type: 'tool-mcp__tracker__projects_tree_by_workspace',
    toolCallId: 'p1',
    state: 'output-available',
    input: { workspace: 'Core' },
    output: 'Релиз 0.3 · Документация · Поддержка',
  },
  taskList,
  {
    type: 'tool-mcp__tracker__search',
    toolCallId: 's1',
    state: 'output-available',
    input: { query: 'просрочено', scope: 'workspace' },
    output: 'Страница «План недели» — 3 совпадения\nЗадача TRK-311 — 1 совпадение',
  },
  taskCreate,
  { type: 'text', text: 'Готово: **5 просроченных задач** собраны в задачу TRK-482.' },
]);

export function Usage() {
  return (
    <Feed>
      <MessageList
        messages={conversation}
        status="ready"
        presentation={rowsPresentation}
        initialScrollBehavior="top"
      />
    </Feed>
  );
}

export function Series() {
  return (
    <Feed>
      <MessageList
        messages={series}
        status="ready"
        presentation={rowsPresentation}
        initialScrollBehavior="top"
      />
    </Feed>
  );
}

export function Narrow() {
  return (
    <Feed width={390}>
      <MessageList
        messages={series}
        status="ready"
        presentation={rowsPresentation}
        initialScrollBehavior="top"
      />
    </Feed>
  );
}

export function Error() {
  return (
    <Feed>
      <MessageList
        messages={turn([
          { type: 'text', text: 'Создам задачу в проекте «Релиз 0.3».' },
          {
            type: 'tool-mcp__tracker__task_create',
            toolCallId: 'm3',
            state: 'output-error',
            input: { project: 'Релиз 0.3', title: 'Разобрать просроченное' },
            errorText:
              'Ошибка сервера: проект «Релиз 0.3» доступен только для чтения\n  workspace: Core\n  требуется роль: редактор\nЗадача не создана.',
          },
        ])}
        status="ready"
        presentation={rowsPresentation}
        initialScrollBehavior="top"
      />
    </Feed>
  );
}

export function Rejected() {
  return (
    <Feed>
      <MessageList
        messages={turn([
          { type: 'text', text: 'Хочу удалить черновик страницы.' },
          {
            type: 'tool-mcp__tracker__page_delete',
            toolCallId: 'm4',
            state: 'output-error',
            input: { page: 'Черновик плана' },
            errorText: 'Rejected by the user',
          },
        ])}
        status="ready"
        presentation={rowsPresentation}
        initialScrollBehavior="top"
      />
    </Feed>
  );
}

export function AwaitingPermission() {
  return (
    <Feed>
      <MessageList
        messages={turn([
          { type: 'text', text: 'Нужно закрыть просроченные задачи пачкой.' },
          {
            type: 'tool-mcp__tracker__task_bulk_update',
            toolCallId: 'm5',
            state: 'input-available',
            input: { filter: 'overdue', status: 'Закрыта', approval: { decision: null } },
          },
          {
            type: 'tool-mcp__tracker__task_list',
            toolCallId: 'm6',
            state: 'input-available',
            input: { project: 'Релиз 0.3' },
          },
          {
            type: 'tool-mcp__tracker__page_get',
            toolCallId: 'm7',
            state: 'input-available',
            input: { page: 'План недели' },
          },
        ])}
        status="streaming"
        presentation={rowsPresentation}
        initialScrollBehavior="top"
      />
    </Feed>
  );
}

export function LongOutput() {
  return (
    <Feed>
      <MessageList
        messages={turn([
          { type: 'text', text: 'Покажу задачи проекта целиком.' },
          {
            type: 'tool-mcp__tracker__task_list',
            toolCallId: 'm8',
            state: 'output-available',
            input: { project: 'Релиз 0.3', limit: 50 },
            output: Array.from(
              { length: 24 },
              (_, index) => `TRK-${400 + index} — задача ${index + 1}`
            ).join('\n'),
          },
        ])}
        status="ready"
        presentation={rowsPresentation}
        initialScrollBehavior="top"
      />
    </Feed>
  );
}

const jsonTasks = {
  type: 'tool-mcp__tracker__task_list',
  toolCallId: 'j1',
  state: 'output-available',
  input: { overdue: true, project: 'Релиз 0.3' },
  output: {
    total: 5,
    tasks: [
      { id: 'TRK-400', title: 'Перенести сборку на oxlint', dueAt: '2026-09-10', points: 5 },
      { id: 'TRK-401', title: 'Обновить лицензии', dueAt: '2026-09-12', points: 2 },
      { id: 'TRK-402', title: 'Почистить старые ветки', dueAt: '2026-09-13', points: 1 },
      { id: 'TRK-403', title: 'Сверить бюджеты бандла', dueAt: '2026-09-14', points: 3 },
      { id: 'TRK-404', title: 'Проверить фикстуры', dueAt: '2026-09-15', points: 2 },
    ],
  },
} as ToolPart;

const jsonPage = {
  type: 'tool-mcp__tracker__page_get',
  toolCallId: 'j2',
  state: 'output-available',
  input: { page: 'План недели' },
  output: {
    id: 'PAGE-7',
    title: 'План недели',
    updatedAt: '2026-09-18',
    words: 1240,
    author: { id: 'U-1', name: 'Sinups' },
  },
} as ToolPart;

const jsonSearch = {
  type: 'tool-mcp__tracker__search',
  toolCallId: 'j3',
  state: 'output-available',
  input: { query: 'просрочено' },
  output: {
    matches: [
      { name: 'План недели', kind: 'page', score: 0.91 },
      { name: 'TRK-311 Починить экспорт', kind: 'task', score: 0.72 },
    ],
  },
} as ToolPart;

const jsonError = {
  type: 'tool-mcp__tracker__task_create',
  toolCallId: 'j4',
  state: 'output-error',
  input: { project: 'Релиз 0.3', title: 'Разобрать просроченное' },
  errorText: 'Ошибка сервера: проект доступен только для чтения\n  требуется роль: редактор',
} as ToolPart;

export function Outputs() {
  return (
    <Feed>
      <MessageList
        messages={turn([
          { type: 'text', text: 'Соберу картину по просроченному.' },
          jsonTasks,
          jsonPage,
          jsonSearch,
          jsonError,
        ])}
        status="ready"
        presentation={rowsPresentation}
        initialScrollBehavior="top"
      />
    </Feed>
  );
}

export function OutputsOfTheHost() {
  return (
    <Feed>
      <MessageList
        messages={turn([
          { type: 'text', text: 'Соберу картину по просроченному.' },
          jsonTasks,
          jsonPage,
        ])}
        status="ready"
        presentation={rowsPresentation}
        initialScrollBehavior="top"
        toolOutputs={{
          'tool-mcp__tracker__task_list': (part) => {
            const tasks = (part.output as { tasks?: Array<{ title: string }> })?.tasks ?? [];
            return `Просрочено: ${tasks.length}. Ближайшая — «${tasks[0]?.title ?? '—'}»`;
          },
          'tool-mcp__tracker__*': () => null,
        }}
      />
    </Feed>
  );
}

export function Working() {
  return (
    <Feed>
      <MessageList
        messages={turn([
          { type: 'text', text: 'Сначала посмотрю, что просрочено.' },
          {
            ...taskList,
            state: 'input-available',
            output: undefined,
            progress: { progress: 3, total: 10, message: 'Читаю задачи' },
          },
        ])}
        status="streaming"
        presentation={rowsPresentation}
        workingRow
        toolActivity
        initialScrollBehavior="top"
      />
    </Feed>
  );
}

Working.parameters = { visual: { skip: true } };
