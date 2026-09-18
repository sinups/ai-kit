import { unwrapMcpOutput } from './McpTool';

describe('tools/unwrapMcpOutput', () => {
  it('reads the structured content of an MCP result, else the text of its content', () => {
    expect(
      unwrapMcpOutput({
        content: [{ type: 'text', text: '{"id":1}' }],
        structuredContent: { id: 1 },
        isError: false,
      })
    ).toEqual({ id: 1 });
    expect(unwrapMcpOutput({ content: [{ type: 'text', text: '{"id":1}' }] })).toBe('{"id":1}');
  });

  it('keeps any other output as it is, JSON text included', () => {
    expect(unwrapMcpOutput('42')).toBe('42');
    expect(unwrapMcpOutput('{"a":[1]}')).toBe('{"a":[1]}');
  });
});
