import { parsePartialJson, parsePartialRecord } from './partial-json';

describe('utils/partial-json', () => {
  it('parses complete JSON unchanged', () => {
    expect(parsePartialJson('{"command":"yarn test"}')).toEqual({ command: 'yarn test' });
    expect(parsePartialJson('[1, 2]')).toEqual([1, 2]);
  });

  it('keeps the value of a string that is still streaming', () => {
    expect(parsePartialJson('{"command": "yarn te')).toEqual({ command: 'yarn te' });
    expect(parsePartialJson('{"file_path": "/repo/a.ts", "old_string": "cons')).toEqual({
      file_path: '/repo/a.ts',
      old_string: 'cons',
    });
  });

  it('drops a key that has no value yet', () => {
    expect(parsePartialJson('{"file_path": "/repo/a.ts", "old_str')).toEqual({
      file_path: '/repo/a.ts',
    });
    expect(parsePartialJson('{"file_path": "/repo/a.ts", "old_string":')).toEqual({
      file_path: '/repo/a.ts',
    });
    expect(parsePartialJson('{"a": 1, "b": tru')).toEqual({ a: 1 });
  });

  it('closes arrays and nested objects', () => {
    expect(
      parsePartialJson('{"todos": [{"content": "Write tests", "status": "completed"}, {"co')
    ).toEqual({ todos: [{ content: 'Write tests', status: 'completed' }] });
    expect(parsePartialJson('{"pattern": "Tool", "paths": ["src/a.ts",')).toEqual({
      pattern: 'Tool',
      paths: ['src/a.ts'],
    });
  });

  it('does not choke on a trailing escape', () => {
    expect(parsePartialJson('{"command": "echo \\')).toEqual({ command: 'echo ' });
  });

  it('returns undefined for text that is not JSON', () => {
    expect(parsePartialJson('not json at all')).toBeUndefined();
    expect(parsePartialJson('')).toBeUndefined();
    expect(parsePartialJson('{oops')).toEqual({});
  });

  it('reads records from objects and from streaming text', () => {
    const record = { a: 1 };
    expect(parsePartialRecord(record)).toBe(record);
    expect(parsePartialRecord('{"a": 1, "b')).toEqual({ a: 1 });
    expect(parsePartialRecord('"plain"')).toBeUndefined();
    expect(parsePartialRecord(42)).toBeUndefined();
  });
});
