import type { ToolPart } from '../types';
import {
  describePendingToolRun,
  describeToolRun,
  groupToolRuns,
  DEFAULT_COLLAPSIBLE_TOOL_TYPES,
  resolveToolRunOptions,
} from './tool-runs';

const tool = (type: string): ToolPart => ({ type, state: 'output-available' });

describe('groupToolRuns', () => {
  const isTool = (item: string) => item.startsWith('t');

  it('groups runs that reach the minimum length', () => {
    expect(groupToolRuns(['t1', 't2', 't3', 'x', 't4'], isTool, 3)).toEqual([
      { kind: 'run', items: ['t1', 't2', 't3'] },
      { kind: 'single', item: 'x' },
      { kind: 'single', item: 't4' },
    ]);
  });

  it('keeps short runs as single items', () => {
    expect(groupToolRuns(['t1', 't2', 'x'], isTool, 3)).toEqual([
      { kind: 'single', item: 't1' },
      { kind: 'single', item: 't2' },
      { kind: 'single', item: 'x' },
    ]);
  });

  it('closes a run at the end of the list', () => {
    expect(groupToolRuns(['x', 't1', 't2'], isTool, 2)).toEqual([
      { kind: 'single', item: 'x' },
      { kind: 'run', items: ['t1', 't2'] },
    ]);
  });
});

describe('resolveToolRunOptions', () => {
  it('is disabled unless requested', () => {
    expect(resolveToolRunOptions(undefined)).toBeNull();
    expect(resolveToolRunOptions(false)).toBeNull();
  });

  it('uses read and search tools with a run of 3 by default', () => {
    const options = resolveToolRunOptions(true)!;
    expect(options.minRun).toBe(3);
    expect(options.types.has('tool-Read')).toBe(true);
    expect(options.types.has('tool-Grep')).toBe(true);
    expect(options.types.has('tool-Edit')).toBe(false);
  });

  it('accepts custom types and run length', () => {
    const options = resolveToolRunOptions({ minRun: 2, types: ['tool-Edit'] })!;
    expect(options.minRun).toBe(2);
    expect([...options.types]).toEqual(['tool-Edit']);
  });
});

describe('describeToolRun', () => {
  it('summarizes reads and searches', () => {
    expect(
      describeToolRun([tool('tool-Read'), tool('tool-Grep'), tool('tool-Read'), tool('tool-Glob')])
    ).toBe('Read 2 files, searched 2 patterns');
  });

  it('uses singular forms and counts other tools', () => {
    expect(describeToolRun([tool('tool-WebSearch'), tool('tool-Custom')])).toBe(
      'Ran 1 web search, used 1 tool'
    );
  });

  it('labels the pending call by its kind', () => {
    expect(describePendingToolRun(tool('tool-Read'))).toBe('Reading...');
    expect(describePendingToolRun(tool('tool-Glob'))).toBe('Searching...');
    expect(describePendingToolRun(undefined)).toBe('Working...');
  });

  it('uses the labels passed through the options', () => {
    const { labels } = resolveToolRunOptions(true, {
      reads: (count) => `leyó ${count} archivos`,
      reading: 'Leyendo...',
    })!;
    expect(
      describeToolRun([tool('tool-Read'), tool('tool-Read'), tool('tool-Custom')], labels)
    ).toBe('Leyó 2 archivos, used 1 tool');
    expect(describePendingToolRun(tool('tool-Read'), labels)).toBe('Leyendo...');
  });
});

describe('DEFAULT_COLLAPSIBLE_TOOL_TYPES', () => {
  it('collapses read, pattern search and web search tools', () => {
    expect([...DEFAULT_COLLAPSIBLE_TOOL_TYPES].sort()).toEqual(
      ['tool-Glob', 'tool-Grep', 'tool-Read', 'tool-Search', 'tool-WebSearch'].sort()
    );
    expect(resolveToolRunOptions(true)?.types.has('tool-Glob')).toBe(true);
  });
});
