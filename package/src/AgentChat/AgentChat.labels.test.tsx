import React from 'react';
import { render, screen } from '@mantine-tests/core';
import type { ChatMessage } from '../types';
import { ChatHeader } from '../ChatHeader/ChatHeader';
import { ToolUnavailableNotice } from '../ChatNotices/ToolUnavailableNotice';
import { AgentChat } from './AgentChat';
import { DEFAULT_AGENT_CHAT_LABELS, type AgentChatLabels } from './agent-chat-labels';

const noop = () => {};

const messages: ChatMessage[] = [
  { id: 'u1', role: 'user', parts: [{ type: 'text', text: 'Найди упавший тест загрузки' }] },
  {
    id: 'a1',
    role: 'assistant',
    parts: [
      { type: 'text', text: 'Смотрю задачи в трекере.' },
      {
        type: 'tool-mcp__tracker__list_issues',
        toolCallId: 'call-list',
        state: 'output-available',
        input: { query: 'upload' },
        output: [{ type: 'text', text: '[]' }],
      },
      {
        type: 'tool-mcp__tracker__create_issue',
        toolCallId: 'call-create',
        state: 'input-available',
        input: { title: 'Нестабильный тест загрузки' },
      },
      { type: 'turn-summary', durationMs: 65_000, tokens: 12_000 },
    ],
  },
];

const RUSSIAN: Partial<AgentChatLabels> = {
  errorTitle: 'Запрос не выполнен',
  placeholder: 'Напишите сообщение…',
  messageList: {
    newMessages: (count) => `Новых сообщений: ${count}`,
    scrollToPrompt: 'К вопросу',
    working: 'Работаю',
    copyMessage: 'Скопировать',
    copied: 'Скопировано',
    messageActions: 'Действия с сообщением',
    search: {},
    toolRuns: {},
  },
  inputBar: {
    send: 'Отправить',
    stop: 'Остановить',
    closeInfoBar: 'Закрыть',
    attach: { attach: 'Прикрепить' },
    attachment: {
      remove: 'Убрать вложение',
      preview: 'Открыть изображение',
      size: (bytes) => `${(bytes / 1024).toFixed(1)} КБ`,
    },
  },
  errorMessage: { retry: 'Повторить', showMore: 'Показать всё', showLess: 'Свернуть' },
  turnSummary: {
    worked: (duration) => `Заняло ${duration}`,
    tokens: (used) => `${used} токенов`,
  },
  mcpTool: {
    activeVerbs: { List: 'Получаем', Create: 'Создаём' },
    completedVerbs: { List: 'Получены', Create: 'Создано' },
  },
  toolCall: {
    queued: 'В очереди',
    awaitingPermission: 'Ждёт разрешения',
    rejected: 'Пропущено',
    renderError: 'Не удалось показать вызов',
  },
  toolApproval: {
    approve: 'Разрешить',
    reject: 'Отклонить',
    approved: 'Разрешено',
    skipped: 'Пропущено',
    moreOptions: 'Другие варианты',
  },
};

const TOOL_MESSAGES: ChatMessage[] = [
  { id: 'u1', role: 'user', parts: [{ type: 'text', text: 'Почини нестабильный тест' }] },
  {
    id: 'a1',
    role: 'assistant',
    parts: [
      {
        type: 'tool-Read',
        toolCallId: 'read',
        state: 'output-available',
        input: { file_path: 'src/upload.ts' },
        output: 'export {}',
      },
      {
        type: 'tool-Grep',
        toolCallId: 'grep',
        state: 'output-available',
        input: { pattern: 'retry' },
        output: { numFiles: 0 },
      },
      {
        type: 'tool-Bash',
        toolCallId: 'bash',
        state: 'output-available',
        input: { command: 'npm test' },
        output: 'ok',
      },
      {
        type: 'tool-Edit',
        toolCallId: 'edit',
        state: 'output-available',
        input: { file_path: 'src/upload.ts', old_string: 'a', new_string: 'b' },
        output: 'ok',
      },
      {
        type: 'tool-Write',
        toolCallId: 'write',
        state: 'output-available',
        input: { file_path: 'src/retry.ts', content: 'b' },
        output: 'ok',
      },
      {
        type: 'tool-TodoWrite',
        toolCallId: 'todo',
        state: 'output-available',
        input: {
          todos: [
            { content: 'Найти причину', status: 'completed' },
            { content: 'Добавить тест', status: 'in_progress' },
          ],
        },
      },
      {
        type: 'tool-Task',
        toolCallId: 'task',
        state: 'output-available',
        input: { description: 'Проверить соседние тесты' },
        output: 'готово',
      },
    ],
  },
];

const RUSSIAN_TOOLS: Partial<AgentChatLabels> = {
  ...RUSSIAN,
  toolTitles: {
    read: 'Прочитан файл',
    reading: 'Читаю файл',
    noMatches: 'Совпадений нет',
    grepped: 'Найдено в {count} файлах',
    ranCommand: 'Выполнена команда',
  },
  toolCard: {
    taskRunning: 'Выполняю задачу',
    taskCompleted: 'Задача выполнена',
    taskInterrupted: 'Задача прервана',
    agentRunning: 'Работает агент',
    agentCompleted: 'Агент закончил',
    agentInterrupted: 'Агент прерван',
    running: 'Выполняется {name}',
  },
  bashTool: { running: 'Выполняется команда: {command}', ran: 'Выполнена команда: {command}' },
  editTool: {
    generating: 'Готовлю правку…',
    creating: 'Создаю {file}',
    editing: 'Изменяю {file}',
    created: 'Создан {file}',
    edited: 'Изменён {file}',
    expand: 'Показать всё',
    collapse: 'Свернуть',
  },
  searchTool: {
    searching: 'Ищу…',
    found: (count) => `Найдено: ${count}`,
    searchedFor: 'Искали',
    unknownQuery: 'поиск…',
  },
};

const TOOL_DATA = ['npm test', 'npm', 'upload.ts', 'retry.ts', 'retry', 'ts', 'tracker', 'ok'];

const CHAT_DATA = ['report.pdf', 'Issues', 'Issue', 'json', 'query', 'upload', 'title'];

function renderRussianChat() {
  return render(
    <AgentChat
      messages={messages}
      status="ready"
      onSend={noop}
      onStop={noop}
      error={new Error('Сервер не ответил')}
      onRetry={noop}
      attachments={{
        onAttach: noop,
        files: [{ id: 'f1', filename: 'report.pdf', size: 1200 }],
        onRemoveFile: noop,
      }}
      approvals={{
        'call-create': {
          reason: 'Создаёт задачу в трекере',
          approveOptions: [{ value: 'session', label: 'На всю сессию' }],
        },
      }}
      labels={RUSSIAN}
    />
  );
}

/** Every text node, accessible name, placeholder and tooltip the user can meet on the screen */
function collectVisibleStrings(root: HTMLElement): string[] {
  const strings = new Set<string>();
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const parent = node.parentElement?.tagName;
    const text = node.textContent?.trim();
    if (text && parent !== 'STYLE' && parent !== 'SCRIPT') {
      strings.add(text);
    }
  }
  root.querySelectorAll('[aria-label], [placeholder], [title]').forEach((element) => {
    for (const attribute of ['aria-label', 'placeholder', 'title']) {
      const value = element.getAttribute(attribute)?.trim();
      if (value) {
        strings.add(value);
      }
    }
  });
  return [...strings];
}

/**
 * Strings that still carry a Latin word once the data of the scenario (file names, commands,
 * tool ids) is cut out: a label the kit did not translate, whether it has a key or is hard-coded.
 */
function findUntranslated(root: HTMLElement, data: string[]): string[] {
  const byLength = [...data].sort((a, b) => b.length - a.length);
  return collectVisibleStrings(root)
    .filter((text) =>
      /[A-Za-z]{2,}/.test(byLength.reduce((rest, token) => rest.split(token).join(' '), text))
    )
    .sort();
}

describe('AgentChat labels', () => {
  it('keeps the English defaults of the chat itself', () => {
    expect(DEFAULT_AGENT_CHAT_LABELS).toEqual({
      errorTitle: 'Request failed',
      placeholder: 'Send a message...',
    });
    render(
      <AgentChat messages={[]} status="ready" onSend={noop} onStop={noop} error={new Error('x')} />
    );
    expect(screen.getByText('Request failed')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Send a message...')).toBeInTheDocument();
  });

  it('lets inputBarProps and emptyState labels win over the chat sections', () => {
    render(
      <AgentChat
        messages={[]}
        status="ready"
        onSend={noop}
        onStop={noop}
        emptyState={{
          title: 'Привет',
          actions: [{ id: 'a', label: 'Начать' }],
          labels: { actions: 'Подсказки' },
        }}
        inputBarProps={{ labels: { send: 'Отправить сейчас' } }}
        labels={{ inputBar: { send: 'Отправить' }, welcome: { actions: 'Действия' } }}
      />
    );
    expect(screen.getByRole('button', { name: 'Отправить сейчас' })).toBeInTheDocument();
    expect(screen.getByLabelText('Подсказки')).toBeInTheDocument();
  });

  it('renders the whole chat in Russian', () => {
    const { container } = renderRussianChat();

    expect(screen.getByText('Запрос не выполнен')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Повторить' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Напишите сообщение…')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Прикрепить' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Убрать вложение' })).toBeInTheDocument();
    expect(screen.getByText(/^Получены/)).toBeInTheDocument();
    expect(screen.getByText(/^Заняло/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Разрешить' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Отклонить' })).toBeInTheDocument();

    expect(findUntranslated(container, CHAT_DATA)).toEqual([]);
  });

  it('renders the tool cards, the header and the notices in Russian', () => {
    const { container } = render(
      <>
        <ChatHeader
          title="Разбор упавшего теста"
          subtitle="Рабочее пространство"
          labels={{ header: 'Заголовок чата' }}
        />
        <AgentChat
          messages={TOOL_MESSAGES}
          status="ready"
          onSend={noop}
          onStop={noop}
          labels={RUSSIAN_TOOLS}
        />
        <ToolUnavailableNotice
          server="tracker"
          message="Соединение оборвалось после трёх попыток."
          onRetry={noop}
          onDismiss={noop}
          labels={{
            title: 'Сервер {server} недоступен.',
            titleWithoutServer: 'Инструмент недоступен.',
            retry: 'Повторить',
            close: 'Скрыть',
          }}
        />
      </>
    );

    expect(screen.getByText(/^Выполнена команда/)).toBeInTheDocument();
    expect(screen.getByText(/^Изменён upload\.ts/)).toBeInTheDocument();
    expect(screen.getByText(/^Создан retry\.ts/)).toBeInTheDocument();
    expect(findUntranslated(container, TOOL_DATA)).toEqual([]);
  });
});
