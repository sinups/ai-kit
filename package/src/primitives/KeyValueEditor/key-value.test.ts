import {
  createKeyValuePair,
  envKeyValidator,
  expandPastedPairs,
  headerKeyValidator,
  isKeyValueText,
  parseKeyValueText,
  validateKeyValuePairs,
  type KeyValuePair,
} from './key-value';

describe('parseKeyValueText', () => {
  it('parses .env lines, skipping blanks and comments', () => {
    const text = [
      '# database',
      'DATABASE_URL=postgres://user:pass@host:5432/db',
      '',
      'export API_KEY = abc123 ',
      'EMPTY=',
      'FLAG',
    ].join('\n');

    expect(parseKeyValueText(text)).toEqual([
      { key: 'DATABASE_URL', value: 'postgres://user:pass@host:5432/db' },
      { key: 'API_KEY', value: 'abc123' },
      { key: 'EMPTY', value: '' },
      { key: 'FLAG', value: '' },
    ]);
  });

  it('unquotes values and keeps hashes inside quotes', () => {
    expect(
      parseKeyValueText(
        'A="multi\\nline"\r\nB=\'single # kept\'\nC=plain # comment\nD=a#b\nE="abc" # prod\nF="say \\"hi\\" # x" # note'
      )
    ).toEqual([
      { key: 'A', value: 'multi\nline' },
      { key: 'B', value: 'single # kept' },
      { key: 'C', value: 'plain' },
      { key: 'D', value: 'a#b' },
      { key: 'E', value: 'abc' },
      { key: 'F', value: 'say "hi" # x' },
    ]);
  });

  it('parses header lines split by the first colon', () => {
    expect(parseKeyValueText('Authorization: Bearer a=b\nX-Trace:1')).toEqual([
      { key: 'Authorization', value: 'Bearer a=b' },
      { key: 'X-Trace', value: '1' },
    ]);
  });
});

describe('isKeyValueText', () => {
  it('detects pasted pairs but not plain keys', () => {
    expect(isKeyValueText('A=1')).toBe(true);
    expect(isKeyValueText('A\nB')).toBe(true);
    expect(isKeyValueText('Authorization: Bearer x')).toBe(true);
    expect(isKeyValueText('API_KEY')).toBe(false);
    expect(isKeyValueText('API_KEY\n')).toBe(false);
  });
});

describe('key validators', () => {
  it('accepts environment variable names only', () => {
    expect(envKeyValidator('NODE_ENV')).toBeNull();
    expect(envKeyValidator('_private1')).toBeNull();
    expect(envKeyValidator('1ABC')).not.toBeNull();
    expect(envKeyValidator('MY-VAR')).not.toBeNull();
  });

  it('accepts HTTP header tokens', () => {
    expect(headerKeyValidator('X-Api-Key')).toBeNull();
    expect(headerKeyValidator('Content Type')).not.toBeNull();
    expect(headerKeyValidator('X:Y')).not.toBeNull();
  });
});

describe('validateKeyValuePairs', () => {
  const pairs: KeyValuePair[] = [
    { id: '1', key: 'A', value: '1' },
    { id: '2', key: '', value: '' },
    { id: '3', key: '', value: 'orphan' },
    { id: '4', key: 'A', value: '2' },
    { id: '5', key: '9', value: '' },
  ];

  it('reports missing, duplicate and invalid keys but ignores blank rows', () => {
    expect(validateKeyValuePairs(pairs)).toEqual({
      '3': 'Key is required',
      '4': 'Duplicate key',
      '5': envKeyValidator('9'),
    });
  });

  it('uses the given validator and labels', () => {
    expect(
      validateKeyValuePairs(pairs, () => null, { keyRequired: 'Needed', duplicateKey: 'Twice' })
    ).toEqual({ '3': 'Needed', '4': 'Twice' });
  });
});

describe('expandPastedPairs', () => {
  const base: KeyValuePair[] = [
    { id: 'a', key: 'FIRST', value: '1' },
    { id: 'b', key: '', value: '', secret: true },
    { id: 'c', key: 'LAST', value: '3' },
  ];

  it('fills the pasted row and inserts the rest after it', () => {
    const result = expandPastedPairs(base, 'b', 'X=1\nY=2');
    expect(result.map(({ key, value }) => `${key}=${value}`)).toEqual([
      'FIRST=1',
      'X=1',
      'Y=2',
      'LAST=3',
    ]);
    expect(result[1]).toMatchObject({ id: 'b', secret: true });
    expect(new Set(result.map((pair) => pair.id)).size).toBe(4);
  });

  it('respects the row limit and ignores unknown rows', () => {
    expect(expandPastedPairs(base, 'b', 'X=1\nY=2\nZ=3', 4)).toHaveLength(4);
    expect(expandPastedPairs(base, 'missing', 'X=1')).toBe(base);
  });

  it('creates rows with unique ids', () => {
    expect(createKeyValuePair().id).not.toBe(createKeyValuePair().id);
  });
});
