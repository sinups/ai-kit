import {
  createMcpServerDraft,
  isValidMcpUrl,
  normalizeMcpServerDraft,
  splitMcpCommandLine,
  validateMcpBasics,
  validateMcpConnection,
  validateMcpPairs,
} from './mcp-draft';
import type { McpServerDraft } from './types';

const draft = (patch: Partial<McpServerDraft> = {}): McpServerDraft => ({
  ...createMcpServerDraft(),
  ...patch,
});

describe('mcp/createMcpServerDraft', () => {
  it('starts empty and copies an edited server', () => {
    expect(createMcpServerDraft()).toEqual({
      id: undefined,
      name: '',
      scope: 'user',
      transport: 'stdio',
      command: '',
      args: [],
      url: '',
      env: [],
      headers: [],
    });
    expect(
      createMcpServerDraft({
        id: 'gh',
        name: 'git',
        transport: 'http',
        status: 'connected',
        url: 'https://git.example.com/mcp/',
        scope: 'project',
      })
    ).toMatchObject({ id: 'gh', name: 'git', transport: 'http', scope: 'project' });
  });
});

describe('mcp/validateMcpBasics', () => {
  it('requires a unique, simple name', () => {
    expect(validateMcpBasics(draft({ name: ' ' }))).toEqual({ name: 'Enter a server name' });
    expect(validateMcpBasics(draft({ name: 'my server' })).name).toBeDefined();
    expect(validateMcpBasics(draft({ name: 'Git' }), ['git'])).toEqual({
      name: 'A server with this name already exists',
    });
    expect(validateMcpBasics(draft({ name: 'git-hub_2.0' }), ['git'])).toEqual({});
  });
});

describe('mcp/validateMcpConnection', () => {
  it('requires a command for stdio', () => {
    expect(validateMcpConnection(draft())).toEqual({
      command: 'Enter the command that starts the server',
    });
    expect(validateMcpConnection(draft({ command: 'npx' }))).toEqual({});
  });

  it('requires a valid http url for remote transports', () => {
    expect(validateMcpConnection(draft({ transport: 'http' }))).toEqual({
      url: 'Enter the server URL',
    });
    expect(validateMcpConnection(draft({ transport: 'sse', url: 'ftp://x' })).url).toBeDefined();
    expect(
      validateMcpConnection(draft({ transport: 'http', url: 'https://errors.example.com/mcp' }))
    ).toEqual({});
  });
});

describe('mcp/isValidMcpUrl', () => {
  it('accepts http and https only', () => {
    expect(isValidMcpUrl('http://localhost:3000/mcp')).toBe(true);
    expect(isValidMcpUrl(' https://example.com ')).toBe(true);
    expect(isValidMcpUrl('example.com')).toBe(false);
    expect(isValidMcpUrl('ws://example.com')).toBe(false);
  });
});

describe('mcp/validateMcpPairs', () => {
  it('validates env keys for stdio and header keys for remote servers', () => {
    const pairs = [{ id: '1', key: 'X-Api-Key', value: '1' }];
    expect(validateMcpPairs(draft({ env: pairs })).env).toBeDefined();
    expect(validateMcpPairs(draft({ transport: 'http', headers: pairs }))).toEqual({});
    expect(
      validateMcpPairs(
        draft({
          transport: 'http',
          headers: [...pairs, { id: '2', key: 'X-Api-Key', value: '2' }],
        })
      )
    ).toEqual({ headers: 'Duplicate key' });
  });
});

describe('mcp/splitMcpCommandLine', () => {
  it('splits on whitespace and keeps quoted parts together', () => {
    expect(
      splitMcpCommandLine('npx -y @modelcontextprotocol/server-filesystem "/Users/me/My Docs"')
    ).toEqual(['npx', '-y', '@modelcontextprotocol/server-filesystem', '/Users/me/My Docs']);
    expect(splitMcpCommandLine(`  node  server.js '' `)).toEqual(['node', 'server.js', '']);
    expect(splitMcpCommandLine('')).toEqual([]);
  });
});

describe('mcp/normalizeMcpServerDraft', () => {
  it('trims values and drops fields of the other transport', () => {
    const pairs = [
      { id: '1', key: ' TOKEN ', value: 'x' },
      { id: '2', key: '', value: '' },
    ];
    expect(
      normalizeMcpServerDraft(
        draft({
          name: ' gh ',
          command: ' npx ',
          args: ['-y', ''],
          url: 'https://x',
          env: pairs,
          headers: pairs,
        })
      )
    ).toMatchObject({
      name: 'gh',
      command: 'npx',
      args: ['-y'],
      url: '',
      env: [{ id: '1', key: 'TOKEN', value: 'x' }],
      headers: [],
    });
    expect(
      normalizeMcpServerDraft(
        draft({ transport: 'http', command: 'npx', url: ' https://x ', headers: pairs })
      )
    ).toMatchObject({
      command: '',
      args: [],
      url: 'https://x',
      env: [],
      headers: [{ key: 'TOKEN' }],
    });
  });
});
