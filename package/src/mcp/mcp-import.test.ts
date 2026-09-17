import { groupConfigWarnings, resolveImportNames, validateImportNames } from './mcp-import';
import type { McpServerCandidate } from './types';

const candidate = (id: string, name: string): McpServerCandidate => ({
  id,
  name,
  transport: 'stdio',
});

describe('resolveImportNames', () => {
  it('keeps free names and suffixes collisions with existing and earlier candidates', () => {
    expect(
      resolveImportNames(
        [
          candidate('a', 'git'),
          candidate('b', 'issues'),
          candidate('c', 'Git'),
          candidate('d', 'fs'),
        ],
        ['git', 'git_1']
      )
    ).toEqual({ a: 'git_2', b: 'issues', c: 'Git_3', d: 'fs' });
  });
});

describe('validateImportNames', () => {
  it('checks the name rules, existing names and duplicates among selected servers', () => {
    const names = { a: 'git', b: 'my server', c: 'dup', d: 'DUP', e: '' };
    expect(validateImportNames(['a', 'b', 'c', 'd', 'e'], names, ['git'])).toEqual({
      a: 'A server with this name already exists',
      b: 'Use letters, digits, dashes and underscores',
      d: 'Another imported server uses this name',
      e: 'Enter a server name',
    });
    expect(validateImportNames(['c'], names, [])).toEqual({});
  });
});

describe('groupConfigWarnings', () => {
  it('groups by file in order of appearance and drops exact duplicates', () => {
    const warnings = [
      {
        file: '.mcp.json',
        path: 'mcpServers.git',
        kind: 'duplicate-name',
        message: 'Duplicate',
      },
      {
        file: '~/.agent/config.json',
        path: 'mcpServers.x.foo',
        kind: 'unknown-field',
        message: 'Unknown field foo',
      },
      {
        file: '.mcp.json',
        path: 'mcpServers.git',
        kind: 'duplicate-name',
        message: 'Duplicate',
      },
      { file: '.mcp.json', path: 'mcpServers.pg.url', kind: 'invalid-value', message: 'Bad URL' },
    ];
    expect(groupConfigWarnings(warnings)).toEqual([
      { file: '.mcp.json', warnings: [warnings[0], warnings[3]] },
      { file: '~/.agent/config.json', warnings: [warnings[1]] },
    ]);
    expect(groupConfigWarnings([])).toEqual([]);
  });
});
