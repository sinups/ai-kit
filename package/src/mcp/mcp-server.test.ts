import {
  formatMcpPromptArguments,
  matchesMcpToolQuery,
  getMcpAgentUiStatus,
  getMcpServerFilterOptions,
  getMcpServerTarget,
  getMcpToolAnnotationKinds,
  getMcpToolCount,
  matchesMcpServerFilter,
  matchesMcpServerQuery,
} from './mcp-server';
import type { McpServer, McpServerStatus } from './types';

const server = (patch: Partial<McpServer>): McpServer => ({
  id: patch.name ?? 'id',
  name: 'server',
  transport: 'stdio',
  status: 'connected',
  ...patch,
});

describe('mcp/getMcpAgentUiStatus', () => {
  it('maps every server status to the shared vocabulary', () => {
    const statuses: McpServerStatus[] = [
      'connected',
      'connecting',
      'disconnected',
      'error',
      'needs-auth',
      'disabled',
    ];
    expect(statuses.map(getMcpAgentUiStatus)).toEqual([
      'success',
      'running',
      'idle',
      'error',
      'needs-auth',
      'disabled',
    ]);
  });
});

describe('mcp/getMcpServerTarget', () => {
  it('joins command and args for stdio and returns the url otherwise', () => {
    expect(getMcpServerTarget({ transport: 'stdio', command: 'npx', args: ['-y', 'pkg'] })).toBe(
      'npx -y pkg'
    );
    expect(getMcpServerTarget({ transport: 'http', url: 'https://issues.example.com/mcp' })).toBe(
      'https://issues.example.com/mcp'
    );
    expect(getMcpServerTarget({ transport: 'sse' })).toBe('');
  });
});

describe('mcp/getMcpToolCount', () => {
  it('prefers loaded tools over the reported count', () => {
    expect(getMcpToolCount(server({ tools: [{ name: 'a' }], toolCount: 5 }))).toBe(1);
    expect(getMcpToolCount(server({ toolCount: 5 }))).toBe(5);
    expect(getMcpToolCount(server({}))).toBeUndefined();
  });
});

describe('mcp/mcp-server server filters', () => {
  const servers = [
    server({ name: 'git', status: 'connected', scope: 'user' }),
    server({
      name: 'issues',
      status: 'needs-auth',
      scope: 'project',
      transport: 'http',
      url: 'https://issues.example.com',
    }),
    server({ name: 'errors', status: 'error' }),
    server({ name: 'postgres', status: 'disabled', scope: 'project' }),
  ];

  it('matches status groups and scopes', () => {
    const names = (filter: string) =>
      servers.filter((item) => matchesMcpServerFilter(item, filter)).map((item) => item.name);
    expect(names('all')).toHaveLength(4);
    expect(names('connected')).toEqual(['git']);
    expect(names('attention')).toEqual(['issues', 'errors']);
    expect(names('disabled')).toEqual(['postgres']);
    expect(names('scope:user')).toEqual(['git', 'errors']);
  });

  it('builds options with counts, skipping empty ones and single scopes', () => {
    expect(getMcpServerFilterOptions(servers)).toEqual([
      { value: 'all', count: 4 },
      { value: 'connected', count: 1 },
      { value: 'attention', count: 2 },
      { value: 'disabled', count: 1 },
      { value: 'scope:project', count: 2 },
      { value: 'scope:user', count: 2 },
    ]);
    expect(getMcpServerFilterOptions([servers[0]]).map((option) => option.value)).toEqual([
      'all',
      'connected',
    ]);
  });

  it('searches name and target', () => {
    expect(matchesMcpServerQuery(servers[1], 'ISS')).toBe(true);
    expect(matchesMcpServerQuery(servers[1], 'issues.example.com')).toBe(true);
    expect(matchesMcpServerQuery(servers[1], 'git')).toBe(false);
    expect(matchesMcpServerQuery(servers[1], '  ')).toBe(true);
  });
});

describe('mcp/getMcpToolAnnotationKinds', () => {
  it('applies the defaults of the MCP specification to missing hints', () => {
    expect(getMcpToolAnnotationKinds(undefined)).toEqual(['destructive', 'open-world']);
    expect(getMcpToolAnnotationKinds({})).toEqual(['destructive', 'open-world']);
    expect(getMcpToolAnnotationKinds({ destructiveHint: false, openWorldHint: false })).toEqual([]);
    expect(getMcpToolAnnotationKinds({ readOnlyHint: true, idempotentHint: true })).toEqual([
      'read-only',
      'open-world',
    ]);
  });

  it('lists explicit hints, read-only wins over destructive', () => {
    expect(
      getMcpToolAnnotationKinds({ readOnlyHint: true, destructiveHint: true, openWorldHint: false })
    ).toEqual(['read-only']);
    expect(
      getMcpToolAnnotationKinds({
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: true,
      })
    ).toEqual(['destructive', 'idempotent', 'open-world']);
  });
});

describe('mcp/mcp-server tool and prompt helpers', () => {
  it('searches tool name, title and description', () => {
    const tool = {
      name: 'create_issue',
      title: 'Create issue',
      description: 'Open a Git issue',
    };
    expect(matchesMcpToolQuery(tool, 'CREATE')).toBe(true);
    expect(matchesMcpToolQuery(tool, 'git')).toBe(true);
    expect(matchesMcpToolQuery(tool, 'merge')).toBe(false);
  });

  it('marks required prompt arguments', () => {
    expect(formatMcpPromptArguments([{ name: 'owner', required: true }, { name: 'focus' }])).toBe(
      'owner*, focus'
    );
  });
});
