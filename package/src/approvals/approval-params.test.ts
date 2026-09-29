import { humanizeParamName, readApprovalParams } from './approval-params';

describe('approvals/approval params', () => {
  it('reads names the way a person would say them', () => {
    expect(humanizeParamName('org_uid')).toBe('Org uid');
    expect(humanizeParamName('verifiedPaymentOnly')).toBe('Verified payment only');
    expect(humanizeParamName('limit')).toBe('Limit');
  });

  it('unfolds nested arguments into lines of their own', () => {
    expect(
      readApprovalParams({
        action: 'smart_search',
        org_uid: '1106955086989844481',
        params: { limit: 10, mode: 'best_match' },
      })
    ).toEqual([
      { label: 'Action', path: 'action', value: 'smart_search' },
      { label: 'Org uid', path: 'org_uid', value: '"1106955086989844481"' },
      { label: 'Params limit', path: 'params.limit', value: '10' },
      { label: 'Params mode', path: 'params.mode', value: 'best_match' },
    ]);
  });

  it('quotes a string only when it would read as another type', () => {
    const params = readApprovalParams({ id: '42', name: 'code audit', flag: 'true', on: true });
    expect(params.map((param) => param.value)).toEqual(['"42"', 'code audit', '"true"', 'true']);
  });

  it('follows the schema for the order and the titles', () => {
    const params = readApprovalParams(
      { limit: 10, query: 'code audit' },
      {
        schema: {
          type: 'object',
          required: ['query'],
          properties: {
            query: { type: 'string', title: 'Search text' },
            limit: { type: 'number' },
          },
        },
      }
    );
    expect(params).toEqual([
      { label: 'Search text', path: 'query', value: 'code audit' },
      { label: 'Limit', path: 'limit', value: '10' },
    ]);
  });

  it('keeps deep objects and arrays readable in one line', () => {
    const params = readApprovalParams(
      { filters: { pay: { verified: true } }, tags: ['react', 'audit'] },
      { depth: 1 }
    );
    expect(params).toEqual([
      { label: 'Filters', path: 'filters', value: '{"pay":{"verified":true}}' },
      { label: 'Tags', path: 'tags', value: 'react, audit' },
    ]);
  });

  it('clips a value that would fill the card', () => {
    const [param] = readApprovalParams({ prompt: 'a'.repeat(200) }, { maxValueChars: 20 });
    expect(param.value).toBe(`${'a'.repeat(20)}…`);
  });

  it('leaves out what the tool was not given', () => {
    expect(readApprovalParams({ a: undefined, b: null })).toEqual([
      { label: 'B', path: 'b', value: 'null' },
    ]);
    expect(readApprovalParams('not an object')).toEqual([]);
  });
});
