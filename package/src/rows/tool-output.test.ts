import type { JsonSchema } from '../primitives/SchemaView/schema';
import {
  DEFAULT_TOOL_OUTPUT_LABELS,
  formatOutputValue,
  getToolOutputValue,
  readOutputValue,
  readPartOutput,
  readCallToolResult,
  readStructuredResult,
  resolveByPartType,
  summarizeToolOutput,
  unwrapToolOutput,
} from './tool-output';

const issuesSchema: JsonSchema = {
  type: 'array',
  items: {
    type: 'object',
    required: ['key', 'title'],
    properties: { key: { type: 'string' }, title: { type: 'string' }, dueAt: { type: 'string' } },
  },
};

const issues = [
  { key: 'TRK-400', title: 'Move the build to oxlint', dueAt: '2026-09-10' },
  { key: 'TRK-401', title: 'Update the licenses' },
  { key: 'TRK-402', title: 'Prune old branches' },
  { key: 'TRK-403', title: 'Check the budgets' },
];

describe('rows/tool-output', () => {
  it('reads a CallToolResult and the bare array of content blocks, nothing else', () => {
    const content = [{ type: 'text', text: 'Done' }];
    expect(readCallToolResult({ content, isError: false })?.content).toEqual(content);
    expect(readCallToolResult(content)).toEqual({ content });
    expect(readCallToolResult({ items: [] })).toBeNull();
    expect(readCallToolResult([{ type: 'row' }])).toBeNull();
  });

  it('counts structured content only when the output schema declares an array', () => {
    const result = { content: [], structuredContent: issues };
    expect(summarizeToolOutput(result, { schema: issuesSchema })).toBe(
      '4 items\nTRK-400 · Move the build to oxlint\nTRK-401 · Update the licenses\n2 more'
    );
    expect(
      summarizeToolOutput({ content: [], structuredContent: [] }, { schema: issuesSchema })
    ).toBe(DEFAULT_TOOL_OUTPUT_LABELS.empty);
    expect(summarizeToolOutput(result)).not.toMatch(/items/);
  });

  it('reads a structured record by the titles and the order of its schema', () => {
    const schema: JsonSchema = {
      type: 'object',
      required: ['name'],
      properties: {
        projects: { type: 'array', title: 'Projects' },
        name: { type: 'string', title: 'Workspace' },
        updatedAt: { type: 'string', format: 'date', title: 'Updated' },
      },
    };
    const structuredContent = {
      projects: [{}, {}],
      name: 'Acme',
      updatedAt: '2026-09-18',
    };
    expect(
      summarizeToolOutput({ content: [], structuredContent }, { schema, locale: 'en-US' })
    ).toBe('Workspace: Acme · Projects: 2 items · Updated: Sep 18, 2026');
  });

  it('gives a result of text alone no summary and never parses it without a schema', () => {
    const page = JSON.stringify({ content: [{ key: 'TRK-1' }], hasMore: false });
    const blocks = [{ type: 'text', text: page }];
    expect(summarizeToolOutput(blocks)).toBe('');
    expect(
      summarizeToolOutput({ content: [{ type: 'text', text: 'Quota exceeded' }], isError: true })
    ).toBe('Quota exceeded');
    expect(readOutputValue(blocks)).toBe(page);
    expect(readPartOutput({ type: 'tool-mcp__tracker__x', output: blocks })).toBe(page);
  });

  it('keeps the 0.3 value of unwrapToolOutput and getToolOutputValue for existing formatters', () => {
    const page = { content: [{ key: 'TRK-1' }], hasMore: false };
    const blocks = [{ type: 'text', text: JSON.stringify(page) }];
    expect(unwrapToolOutput(blocks)).toEqual(page);
    expect(unwrapToolOutput({ content: blocks, structuredContent: { other: 1 } })).toEqual(page);
    expect(unwrapToolOutput('{"a":1}')).toEqual({ a: 1 });
    expect(unwrapToolOutput({ type: 'text', text: 'plain' })).toBe('plain');
    expect(getToolOutputValue({ type: 'tool-mcp__tracker__x', output: blocks })).toEqual(page);
  });

  it('parses text only as the serialized structured content its schema describes', () => {
    const text = [{ type: 'text', text: JSON.stringify(issues) }];
    expect(readStructuredResult({ content: text as never }, issuesSchema)).toEqual(issues);
    expect(
      readStructuredResult({ content: [{ type: 'text', text: '{"a":1}' }] }, issuesSchema)
    ).toBeUndefined();
    expect(readStructuredResult({ content: text as never })).toBeUndefined();
  });

  it('names the resources and media of a result without text', () => {
    expect(
      summarizeToolOutput({
        content: [
          { type: 'resource_link', uri: 'https://a/spec.pdf', name: 'spec.pdf', title: 'Spec' },
          { type: 'image', data: 'AAA', mimeType: 'image/png' },
        ],
      })
    ).toBe('Spec, image/png');
  });

  it('keeps plain outputs and the text of a failure as they are', () => {
    expect(summarizeToolOutput('Created TRK-482')).toBe('Created TRK-482');
    expect(
      getToolOutputValue({ type: 'tool-Bash', state: 'output-error', errorText: 'Build failed' })
    ).toBe('Build failed');
  });

  it('formats numbers by locale, dates only when the schema says so, and clips long values', () => {
    expect(formatOutputValue(1234567.5, 'ru-RU').replace(/\s/g, ' ')).toBe('1 234 567,5');
    expect(formatOutputValue('2026-09-18', 'en-US')).toBe('2026-09-18');
    expect(formatOutputValue('2026-09-18', 'en-US', { type: 'string', format: 'date' })).toBe(
      'Sep 18, 2026'
    );
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
