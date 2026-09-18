import { summarizeToolArgs, unfoldToolArgs } from './tool-args';
import { findToolCatalogEntry, getToolCatalogTitle } from './tool-presentation';

describe('tools/tool-args', () => {
  it('unfolds a JSON string argument into its fields and keeps the rest as is', () => {
    expect(
      unfoldToolArgs({
        payload: '{"assigneeIds":["alice"],"size":100}',
        approval: { decision: null },
      })
    ).toEqual({ assigneeIds: ['alice'], size: 100, approval: { decision: null } });
    expect(unfoldToolArgs('{"query":"просрочено"}')).toEqual({ query: 'просрочено' });
    expect(unfoldToolArgs({ note: '{ not json' })).toEqual({ note: '{ not json' });
  });

  it('keeps a few significant fields and reads them like a person would', () => {
    const args = unfoldToolArgs({
      payload: JSON.stringify({
        assigneeIds: ['alice'],
        overdue: true,
        archived: false,
        workspaceId: '0b8e2c1a-7f4d-4a55-9d2e-3c1b5a6f7e80',
        size: 100,
        sorting: [{ field: 'dueDate', direction: 'asc' }],
      }),
    });

    expect(summarizeToolArgs(args)).toBe('assigneeIds: alice · overdue · size: 100');
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

  it('formats dates of the arguments by locale', () => {
    expect(summarizeToolArgs({ dueDate: '2026-09-25' }, { locale: 'en-US' })).toBe(
      'dueDate: Sep 25, 2026'
    );
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
