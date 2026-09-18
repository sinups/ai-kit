import {
  DEFAULT_TOOL_OUTPUT_LABELS,
  formatOutputValue,
  getToolOutputValue,
  resolveByPartType,
  summarizeToolOutput,
} from './tool-output';

describe('rows/tool-output', () => {
  it('counts a list and shows the first entries by their title', () => {
    const tasks = [
      { id: 'TRK-400', title: 'Перенести сборку на oxlint', dueAt: '2026-09-10' },
      { id: 'TRK-401', title: 'Обновить лицензии' },
      { id: 'TRK-402', title: 'Почистить старые ветки' },
      { id: 'TRK-403', title: 'Сверить бюджеты' },
    ];

    expect(summarizeToolOutput(tasks)).toBe(
      '4 items\nTRK-400 · Перенести сборку на oxlint\nTRK-401 · Обновить лицензии\n2 more'
    );
  });

  it('finds the list inside a result envelope and reports an empty one', () => {
    expect(summarizeToolOutput({ total: 2, tasks: [{ name: 'Первая' }, { name: 'Вторая' }] })).toBe(
      '2 items\nПервая\nВторая'
    );
    expect(summarizeToolOutput({ total: 12, items: [{ name: 'Первая' }] })).toBe(
      '12 items\nПервая\n11 more'
    );
    expect(summarizeToolOutput({ tasks: [] })).toBe(DEFAULT_TOOL_OUTPUT_LABELS.empty);
  });

  it('turns a record with an id and a title into one line', () => {
    expect(
      summarizeToolOutput({ id: 'PAGE-7', title: 'План недели', updatedAt: '2026-09-18' })
    ).toBe('PAGE-7 · План недели');
  });

  it('keeps text, MCP content and the text of a failure as they are', () => {
    expect(summarizeToolOutput('Создана задача TRK-482')).toBe('Создана задача TRK-482');
    expect(summarizeToolOutput({ content: [{ type: 'text', text: '3 задачи' }] })).toBe('3 задачи');
    expect(
      getToolOutputValue({ type: 'tool-Bash', state: 'output-error', errorText: 'Build failed' })
    ).toBe('Build failed');
  });

  it('opens a page of results that arrives as MCP content blocks', () => {
    const page = {
      size: 100,
      offset: 0,
      totalPages: 1,
      hasMore: false,
      page: 0,
      content: [
        { key: 'DOCU-1', title: 'Описать кейсы', dueDate: '2026-03-31' },
        { key: 'TRK-4', title: 'make design' },
        { key: 'TRK-2', title: 'Загрузка видео' },
        { key: 'TRK-5', title: 'in progress' },
        { key: 'TRK-8', title: 'Проверить стриминг' },
      ],
    };
    const blocks = [{ type: 'text', text: JSON.stringify(page) }];

    expect(summarizeToolOutput(blocks)).toBe(
      '5 items\nDOCU-1 · Описать кейсы\nTRK-4 · make design\n3 more'
    );
    expect(summarizeToolOutput({ content: blocks })).toBe(summarizeToolOutput(blocks));
    expect(getToolOutputValue({ type: 'tool-mcp__tracker__x', output: blocks })).toEqual(page);
  });

  it('reads a record without a title as its facts, collections by their size', () => {
    const context = {
      workspaceId: '0b8e2c1a-7f4d-4a55-9d2e-3c1b5a6f7e80',
      workspaceName: 'Acme',
      projects: [{ name: 'Core' }, { name: 'Docs' }],
      members: Array.from({ length: 11 }, (_, index) => ({ name: `user ${index}` })),
    };

    expect(summarizeToolOutput([{ type: 'text', text: JSON.stringify(context) }])).toBe(
      'workspaceName: Acme · projects: 2 · members: 11'
    );
  });

  it('never leads a line with a UUID and prefers the human key of an item', () => {
    const tasks = [
      { id: '9e6a6e0d-3aed-4c1b-9d2e-3c1b5a6f7e80', key: 'TRK-2', title: 'Загрузка видео' },
      { id: '1b2c3d4e-5f60-4a55-9d2e-3c1b5a6f7e81', title: 'Без ключа' },
    ];

    expect(summarizeToolOutput(tasks)).toBe('2 items\nTRK-2 · Загрузка видео\nБез ключа');
  });

  it('falls back to pretty JSON for a shape it does not know', () => {
    const output = { a: { b: { c: 1 } }, d: null };
    expect(summarizeToolOutput(output)).toBe(JSON.stringify(output, null, 2));
  });

  it('formats numbers and dates by locale and clips long values', () => {
    expect(formatOutputValue(1234567.5, 'ru-RU').replace(/ /g, ' ')).toBe('1 234 567,5');
    expect(formatOutputValue('2026-09-18', 'en-US')).toBe('Sep 18, 2026');
    expect(formatOutputValue('x'.repeat(200))).toHaveLength(81);
  });

  it('picks the exact formatter, then the server-wide one, and ignores the rest', () => {
    const exact = () => 'exact';
    const server = () => 'server';
    const formatters = {
      'tool-mcp__tracker__task_list': exact,
      'tool-mcp__tracker__*': server,
      'tool-mcp__other__*': () => 'other',
    };

    expect(resolveByPartType(formatters, 'tool-mcp__tracker__task_list')).toBe(exact);
    expect(resolveByPartType(formatters, 'tool-mcp__tracker__page_get')).toBe(server);
    expect(resolveByPartType(formatters, 'tool-Read')).toBeUndefined();
    expect(resolveByPartType(undefined, 'tool-Read')).toBeUndefined();
  });
});
