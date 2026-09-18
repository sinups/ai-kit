import { clampLines, getToolRowArgs, getToolRowName } from './rows-format';
import { getEditSummary } from './rows-summary';

describe('rows/rows-format', () => {
  it('names a built-in call, a dynamic one and an MCP call', () => {
    expect(getToolRowName({ type: 'tool-Read' })).toBe('Read');
    expect(getToolRowName({ type: 'tool-mcp__tracker__task_list' })).toBe('task_list');
    expect(getToolRowName({ type: 'dynamic-tool', toolName: 'search_tasks' })).toBe('search_tasks');
  });

  it('shows the single argument of a call alone and the rest as pairs', () => {
    expect(getToolRowArgs({ type: 'tool-Read', input: { file_path: 'src/app.ts' } })).toBe(
      'src/app.ts'
    );
    expect(
      getToolRowArgs({ type: 'tool-mcp__tracker__task_list', input: { overdue: true, limit: 20 } })
    ).toBe('overdue: true, limit: 20');
  });

  it('clips every value on its own so a long one does not eat the others', () => {
    const args = getToolRowArgs({
      type: 'tool-mcp__tracker__search',
      input: { title: 'AI-индустрия в 2026 году: '.repeat(6), limit: 5 },
    });

    expect(args).toContain('…');
    expect(args.endsWith('limit: 5')).toBe(true);
  });

  it('shows every argument the call carries; the host hides its own keys with toolArgs', () => {
    expect(
      getToolRowArgs({
        type: 'tool-mcp__tracker__task_bulk_update',
        input: { filter: 'overdue', approval: { decision: null } },
      })
    ).toBe('filter: overdue, approval: {"decision":null}');
  });

  it('keeps the first lines and counts the rest', () => {
    expect(clampLines('a\nb', 3)).toEqual({ text: 'a\nb', hidden: 0 });
    expect(clampLines('a\nb\nc\nd\ne', 3)).toEqual({ text: 'a\nb\nc', hidden: 2 });
  });

  it('counts the lines an edit changed', () => {
    expect(
      getEditSummary({
        type: 'tool-Edit',
        input: { file_path: '/repo/src/app.ts', old_string: 'a\nb', new_string: 'a\nc\nd' },
      })
    ).toEqual({ file: 'app.ts', added: 2, removed: 1 });

    expect(
      getEditSummary({ type: 'tool-Read', input: { file_path: 'src/app.ts' } })
    ).toBeUndefined();
  });
});
