import { unwrapMcpOutput } from './McpTool';

describe('tools/unwrapMcpOutput', () => {
  it('unwraps MCP CallToolResult content blocks', () => {
    expect(
      unwrapMcpOutput({ content: [{ type: 'text', text: '{"id":1}' }], isError: false })
    ).toEqual({ id: 1 });
  });

  it('keeps plain strings that are not JSON objects or arrays', () => {
    expect(unwrapMcpOutput('42')).toBe('42');
    expect(unwrapMcpOutput('hello')).toBe('hello');
  });

  it('parses JSON object strings', () => {
    expect(unwrapMcpOutput('{"a":[1]}')).toEqual({ a: [1] });
  });
});
