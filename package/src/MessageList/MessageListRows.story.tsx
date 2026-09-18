import React from 'react';
import type { ChatMessage, ToolPart } from '../types';
import { MessageList } from './MessageList';

export default { title: 'MessageList/rows' };

function Feed({ width = 520, children }: { width?: number; children: React.ReactNode }) {
  return <div style={{ height: '80vh', width, margin: '0 auto', display: 'flex' }}>{children}</div>;
}

const workspaceContext: ToolPart = {
  type: 'tool-mcp__layers__workspace_context',
  toolCallId: 'w1',
  state: 'output-available',
  input: {},
  output: 'Пространство Layers, проект «Релиз 0.3», открыта страница «План недели»',
};

const taskList: ToolPart = {
  type: 'tool-mcp__layers__task_list',
  toolCallId: 'm1',
  state: 'output-available',
  input: { overdue: true, workspace: 'Layers', limit: 20 },
  output:
    'Перенести сборку на oxlint — просрочена на 4 дня\nОбновить лицензии — просрочена на 2 дня\nПочистить старые ветки — просрочена на 1 день\nСверить бюджеты бандла — просрочена на 1 день\nПроверить фикстуры — просрочена сегодня',
};

const taskCreate: ToolPart = {
  type: 'tool-mcp__layers__task_create',
  toolCallId: 'm2',
  state: 'output-available',
  input: { project: 'Релиз 0.3', title: 'Разобрать просроченное', assignee: 'Sinups' },
  output: 'Создана задача LAY-482 «Разобрать просроченное»',
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
    type: 'tool-mcp__layers__projects_tree_by_workspace',
    toolCallId: 'p1',
    state: 'output-available',
    input: { workspace: 'Layers' },
    output: 'Релиз 0.3 · Документация · Поддержка',
  },
  taskList,
  {
    type: 'tool-mcp__layers__search',
    toolCallId: 's1',
    state: 'output-available',
    input: { query: 'просрочено', scope: 'workspace' },
    output: 'Страница «План недели» — 3 совпадения\nЗадача LAY-311 — 1 совпадение',
  },
  taskCreate,
  { type: 'text', text: 'Готово: **5 просроченных задач** собраны в задачу LAY-482.' },
]);

export function Usage() {
  return (
    <Feed>
      <MessageList
        messages={conversation}
        status="ready"
        presentation="rows"
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
        presentation="rows"
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
        presentation="rows"
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
            type: 'tool-mcp__layers__task_create',
            toolCallId: 'm3',
            state: 'output-error',
            input: { project: 'Релиз 0.3', title: 'Разобрать просроченное' },
            errorText:
              'Ошибка сервера: проект «Релиз 0.3» доступен только для чтения\n  workspace: Layers\n  требуется роль: редактор\nЗадача не создана.',
          },
        ])}
        status="ready"
        presentation="rows"
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
            type: 'tool-mcp__layers__page_delete',
            toolCallId: 'm4',
            state: 'output-error',
            input: { page: 'Черновик плана' },
            errorText: 'Rejected by the user',
          },
        ])}
        status="ready"
        presentation="rows"
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
            type: 'tool-mcp__layers__task_bulk_update',
            toolCallId: 'm5',
            state: 'input-available',
            input: { filter: 'overdue', status: 'Закрыта', approval: { decision: null } },
          },
          {
            type: 'tool-mcp__layers__task_list',
            toolCallId: 'm6',
            state: 'input-available',
            input: { project: 'Релиз 0.3' },
          },
          {
            type: 'tool-mcp__layers__page_get',
            toolCallId: 'm7',
            state: 'input-available',
            input: { page: 'План недели' },
          },
        ])}
        status="streaming"
        presentation="rows"
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
            type: 'tool-mcp__layers__task_list',
            toolCallId: 'm8',
            state: 'output-available',
            input: { project: 'Релиз 0.3', limit: 50 },
            output: Array.from(
              { length: 24 },
              (_, index) => `LAY-${400 + index} — задача ${index + 1}`
            ).join('\n'),
          },
        ])}
        status="ready"
        presentation="rows"
        initialScrollBehavior="top"
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
        presentation="rows"
        workingRow
        toolActivity
        initialScrollBehavior="top"
      />
    </Feed>
  );
}

Working.parameters = { visual: { skip: true } };
