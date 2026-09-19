import { readToolArgs, summarizeToolArgs, unfoldToolArgs } from './tool-args';
import { findToolCatalogEntry, getToolCatalogTitle } from './tool-presentation';

describe('tools/tool-args', () => {
  it('still unfolds JSON string arguments for hosts of 0.3, deprecated', () => {
    expect(
      unfoldToolArgs({
        payload: '{"assigneeIds":["alice"],"size":100}',
        approval: { decision: null },
      })
    ).toEqual({ assigneeIds: ['alice'], size: 100, approval: { decision: null } });
    expect(unfoldToolArgs('{"query":"просрочено"}')).toEqual({ query: 'просрочено' });
    expect(unfoldToolArgs({ note: '{ not json' })).toEqual({ note: '{ not json' });
  });

  it('reads the arguments as the tool received them: a string stays a string', () => {
    const args = readToolArgs({
      payload: '{"size":100}',
      assigneeIds: ['alice'],
      overdue: true,
      archived: false,
      size: 100,
    });

    expect(summarizeToolArgs(args)).toBe('payload: {"size":100} · assigneeIds: alice · overdue');
    expect(readToolArgs('{"query":"x"}')).toEqual({});
  });

  it('takes the titles of the arguments from the schema', () => {
    expect(
      summarizeToolArgs(
        { q: 'overdue', size: 20 },
        { schema: { type: 'object', properties: { q: { type: 'string', title: 'Query' } } } }
      )
    ).toBe('Query: overdue · size: 20');
  });

  it('follows the order of the schema, required fields first', () => {
    expect(
      summarizeToolArgs(
        { limit: 5, title: 'Отчёт', project: 'Релиз' },
        {
          schema: {
            type: 'object',
            required: ['title'],
            properties: { project: { type: 'string' }, title: { type: 'string' } },
          },
        }
      )
    ).toBe('title: Отчёт · project: Релиз · limit: 5');
  });

  it('formats a date argument only when the schema says it is a date', () => {
    expect(summarizeToolArgs({ dueDate: '2026-09-25' }, { locale: 'en-US' })).toBe(
      'dueDate: 2026-09-25'
    );
    expect(
      summarizeToolArgs(
        { dueDate: '2026-09-25' },
        {
          locale: 'en-US',
          schema: { type: 'object', properties: { dueDate: { type: 'string', format: 'date' } } },
        }
      )
    ).toBe('dueDate: Sep 25, 2026');
  });
});

describe('tools/tool-presentation', () => {
  const catalog = {
    mcp__tracker__tracker_task_list_smart: { title: 'Найти задачи по условиям' },
    search_pages: { annotations: { title: 'Найти страницу' } },
  };

  it('finds a tool by the name the call carries and reads its title', () => {
    const entry = findToolCatalogEntry(catalog, {
      type: 'tool-mcp__tracker__tracker_task_list_smart',
    });
    expect(getToolCatalogTitle(entry)).toBe('Найти задачи по условиям');

    const bare = findToolCatalogEntry(catalog, { type: 'dynamic-tool', toolName: 'search_pages' });
    expect(getToolCatalogTitle(bare)).toBe('Найти страницу');

    expect(findToolCatalogEntry(catalog, { type: 'tool-Read' })).toBeUndefined();
    expect(findToolCatalogEntry(undefined, { type: 'tool-Read' })).toBeUndefined();
  });
});
