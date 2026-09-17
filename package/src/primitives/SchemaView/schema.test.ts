import {
  flattenSchema,
  getDefaultExpandedPaths,
  getSchemaTypeLabel,
  getVisibleSchemaRows,
  type JsonSchema,
} from './schema';

const pick = (schema: JsonSchema) =>
  flattenSchema(schema).map(({ path, parentPath, name, type, required, depth, hasChildren }) => ({
    path,
    parentPath,
    name,
    type,
    required,
    depth,
    hasChildren,
  }));

describe('getSchemaTypeLabel', () => {
  it('describes scalars, arrays, nullable and unions', () => {
    expect(getSchemaTypeLabel({ type: 'string' })).toBe('string');
    expect(getSchemaTypeLabel({ type: ['string', 'null'] })).toBe('string | null');
    expect(getSchemaTypeLabel({ type: 'array', items: { type: 'integer' } })).toBe('integer[]');
    expect(getSchemaTypeLabel({ type: 'array' })).toBe('array');
    expect(
      getSchemaTypeLabel({
        type: 'array',
        items: { anyOf: [{ type: 'string' }, { type: 'number' }] },
      })
    ).toBe('(string | number)[]');
    expect(getSchemaTypeLabel({ properties: {} })).toBe('object');
    expect(getSchemaTypeLabel({ enum: ['a'] })).toBe('enum');
    expect(getSchemaTypeLabel({ const: 'x' })).toBe('"x"');
    expect(getSchemaTypeLabel({})).toBe('any');
  });
});

describe('flattenSchema', () => {
  it('flattens nested objects with required flags and metadata', () => {
    const rows = flattenSchema({
      type: 'object',
      required: ['repo'],
      properties: {
        repo: { type: 'string', description: 'owner/name', format: 'uri' },
        options: {
          type: 'object',
          required: ['depth'],
          properties: {
            depth: { type: 'integer', minimum: 1, maximum: 10, default: 3 },
            mode: { type: 'string', enum: ['fast', 'full'], title: 'Mode' },
          },
        },
      },
    });

    expect(rows.map((row) => [row.path, row.parentPath, row.depth, row.required])).toEqual([
      ['repo', null, 0, true],
      ['options', null, 0, false],
      ['options.depth', 'options', 1, true],
      ['options.mode', 'options', 1, false],
    ]);
    expect(rows[0]).toMatchObject({ description: 'owner/name', format: 'uri', hasChildren: false });
    expect(rows[1].hasChildren).toBe(true);
    expect(rows[2]).toMatchObject({ default: 3, minimum: 1, maximum: 10, type: 'integer' });
    expect(rows[3]).toMatchObject({ enum: ['fast', 'full'], description: 'Mode' });
  });

  it('lists properties of array items under the array row', () => {
    expect(
      pick({
        type: 'object',
        properties: {
          files: {
            type: 'array',
            items: {
              type: 'object',
              required: ['path'],
              properties: { path: { type: 'string' }, content: { type: 'string' } },
            },
          },
          tags: { type: 'array', items: { type: 'string' } },
        },
      })
    ).toEqual([
      {
        path: 'files',
        parentPath: null,
        name: 'files',
        type: 'object[]',
        required: false,
        depth: 0,
        hasChildren: true,
      },
      {
        path: 'files[].path',
        parentPath: 'files',
        name: 'path',
        type: 'string',
        required: true,
        depth: 1,
        hasChildren: false,
      },
      {
        path: 'files[].content',
        parentPath: 'files',
        name: 'content',
        type: 'string',
        required: false,
        depth: 1,
        hasChildren: false,
      },
      {
        path: 'tags',
        parentPath: null,
        name: 'tags',
        type: 'string[]',
        required: false,
        depth: 0,
        hasChildren: false,
      },
    ]);
  });

  it('adds a row per union variant only when a variant has properties', () => {
    const rows = flattenSchema({
      type: 'object',
      properties: {
        target: {
          oneOf: [
            { title: 'By id', type: 'object', properties: { id: { type: 'string' } } },
            { type: 'object', properties: { name: { type: 'string' } } },
          ],
        },
        level: { oneOf: [{ const: 'low' }, { const: 'high' }] },
        value: { anyOf: [{ type: 'string' }, { type: 'number' }] },
      },
    });

    expect(rows.map((row) => [row.path, row.parentPath, row.name, row.type, row.depth])).toEqual([
      ['target', null, 'target', 'object', 0],
      ['target~0', 'target', 'By id', 'object', 1],
      ['target~0.id', 'target~0', 'id', 'string', 2],
      ['target~1', 'target', 'Option 2', 'object', 1],
      ['target~1.name', 'target~1', 'name', 'string', 2],
      ['level', null, 'level', '"low" | "high"', 0],
      ['value', null, 'value', 'string | number', 0],
    ]);
    expect(rows[5].enum).toEqual(['low', 'high']);
  });

  it('flattens a root array and stops on cycles', () => {
    const node: JsonSchema = { type: 'object', properties: { name: { type: 'string' } } };
    node.properties!.child = node;

    expect(pick({ type: 'array', items: node }).map((row) => row.path)).toEqual([
      '[].name',
      '[].child',
    ]);
    expect(flattenSchema({ type: 'string' })).toEqual([]);
  });
});

describe('getVisibleSchemaRows', () => {
  const rows = flattenSchema({
    type: 'object',
    properties: {
      a: {
        type: 'object',
        properties: { b: { type: 'object', properties: { c: { type: 'string' } } } },
      },
      d: { type: 'string' },
    },
  });

  it('hides descendants of collapsed rows', () => {
    expect(getVisibleSchemaRows(rows, new Set()).map((row) => row.path)).toEqual(['a', 'd']);
    expect(getVisibleSchemaRows(rows, new Set(['a'])).map((row) => row.path)).toEqual([
      'a',
      'a.b',
      'd',
    ]);
    expect(getVisibleSchemaRows(rows, new Set(['b', 'a.b'])).map((row) => row.path)).toEqual([
      'a',
      'd',
    ]);
  });

  it('expands rows above the given depth by default', () => {
    expect(getDefaultExpandedPaths(rows, 0)).toEqual(new Set());
    expect(getDefaultExpandedPaths(rows, 1)).toEqual(new Set(['a']));
    expect(getDefaultExpandedPaths(rows, 5)).toEqual(new Set(['a', 'a.b']));
  });
});
