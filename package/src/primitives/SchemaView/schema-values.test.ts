import { flattenSchemaValues, formatSchemaValue, isLikelySecretKey } from './schema-values';
import type { JsonSchema } from './schema';

const SCHEMA: JsonSchema = {
  type: 'object',
  required: ['query'],
  properties: {
    query: { type: 'string', description: 'Search text' },
    limit: { type: 'integer' },
    filters: {
      type: 'object',
      properties: { state: { type: 'string', enum: ['open', 'closed'] } },
    },
    tags: { type: 'array', items: { type: 'string' } },
  },
};

describe('primitives/SchemaView/schema-values', () => {
  it('keeps schema order, marks required fields and appends unknown keys', () => {
    const rows = flattenSchemaValues(SCHEMA, { limit: 10, extra: 'x', query: 'auth' });

    expect(rows.map((row) => row.name)).toEqual(['query', 'limit', 'filters', 'tags', 'extra']);
    expect(rows[0]).toMatchObject({ required: true, present: true, known: true, type: 'string' });
    expect(rows[0].description).toBe('Search text');
    expect(rows[2]).toMatchObject({ present: false, kind: 'leaf' });
    expect(rows[4]).toMatchObject({ name: 'extra', known: false, type: undefined });
  });

  it('walks nested objects and array items', () => {
    const rows = flattenSchemaValues(SCHEMA, {
      query: 'auth',
      filters: { state: 'open' },
      tags: ['bug', 'auth'],
    });
    const byPath = new Map(rows.map((row) => [row.path, row]));

    expect(byPath.get('filters')).toMatchObject({ kind: 'object', size: 1, hasChildren: true });
    expect(byPath.get('filters.state')).toMatchObject({ depth: 1, value: 'open' });
    expect(byPath.get('tags')).toMatchObject({ kind: 'array', size: 2 });
    expect(byPath.get('tags[1]')).toMatchObject({ name: '[1]', value: 'auth', type: 'string' });
  });

  it('picks the union variant that matches the value', () => {
    const schema: JsonSchema = {
      type: 'object',
      properties: {
        target: {
          anyOf: [
            { title: 'Project', type: 'object', properties: { projectId: { type: 'string' } } },
            { title: 'Milestone', type: 'object', properties: { milestone: { type: 'integer' } } },
          ],
        },
      },
    };
    const rows = flattenSchemaValues(schema, { target: { milestone: 4 } });

    expect(rows.map((row) => row.path)).toEqual(['target', 'target.milestone']);
    expect(rows[1].type).toBe('integer');
  });

  it('survives a value that references itself', () => {
    const values: Record<string, unknown> = { query: 'auth' };
    values.self = values;

    expect(() => flattenSchemaValues(SCHEMA, values)).not.toThrow();
  });

  it('formats leaf values as one line', () => {
    expect(formatSchemaValue('plain')).toBe('plain');
    expect(formatSchemaValue(12)).toBe('12');
    expect(formatSchemaValue(null)).toBe('null');
    expect(formatSchemaValue(undefined)).toBe('');
  });

  it('recognizes credential-looking names', () => {
    expect(isLikelySecretKey('apiToken')).toBe(true);
    expect(isLikelySecretKey('API_KEY')).toBe(true);
    expect(isLikelySecretKey('user.password')).toBe(true);
    expect(isLikelySecretKey('title')).toBe(false);
    expect(isLikelySecretKey('tokenizer')).toBe(false);
  });
});
