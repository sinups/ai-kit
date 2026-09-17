import {
  formatMemoryUpdatedAt,
  getMemoryFileName,
  matchesMemoryQuery,
  sortMemoryFiles,
} from './memory-files';
import type { MemoryFile } from './types';

const file = (patch: Partial<MemoryFile>): MemoryFile => ({
  id: patch.path ?? 'id',
  scope: 'project',
  path: 'AGENTS.md',
  content: '',
  ...patch,
});

describe('memory/getMemoryFileName', () => {
  it('returns the last path segment for posix and windows paths', () => {
    expect(getMemoryFileName('~/.agent/AGENTS.md')).toBe('AGENTS.md');
    expect(getMemoryFileName('C:\\repo\\AGENTS.local.md')).toBe('AGENTS.local.md');
    expect(getMemoryFileName('notes.md')).toBe('notes.md');
    expect(getMemoryFileName('dir/')).toBe('dir');
  });
});

describe('memory/sortMemoryFiles', () => {
  it('orders by scope, then agent name, then path', () => {
    const sorted = sortMemoryFiles([
      file({ scope: 'agent', path: 'b.md', agentName: 'reviewer' }),
      file({ scope: 'local', path: 'AGENTS.local.md' }),
      file({ scope: 'agent', path: 'a.md', agentName: 'writer' }),
      file({ scope: 'user', path: '~/.agent/AGENTS.md' }),
      file({ scope: 'project', path: 'src/AGENTS.md' }),
      file({ scope: 'project', path: 'AGENTS.md' }),
    ]);
    expect(sorted.map((item) => item.path)).toEqual([
      '~/.agent/AGENTS.md',
      'AGENTS.md',
      'src/AGENTS.md',
      'AGENTS.local.md',
      'b.md',
      'a.md',
    ]);
  });
});

describe('memory/matchesMemoryQuery', () => {
  const memory = file({
    path: 'src/AGENTS.md',
    content: 'Use yarn, not npm',
    agentName: 'reviewer',
  });

  it('matches path, content and agent name with every word', () => {
    expect(matchesMemoryQuery(memory, '')).toBe(true);
    expect(matchesMemoryQuery(memory, 'SRC')).toBe(true);
    expect(matchesMemoryQuery(memory, 'yarn npm')).toBe(true);
    expect(matchesMemoryQuery(memory, 'reviewer')).toBe(true);
    expect(matchesMemoryQuery(memory, 'yarn pnpm')).toBe(false);
  });
});

describe('memory/formatMemoryUpdatedAt', () => {
  const now = Date.parse('2026-09-17T12:00:00Z');

  it('formats relative time in the largest fitting unit', () => {
    expect(formatMemoryUpdatedAt('2026-09-17T11:55:00Z', now, 'en')).toBe('5 minutes ago');
    expect(formatMemoryUpdatedAt('2026-09-17T11:59:40Z', now, 'en')).toBe('this minute');
    expect(formatMemoryUpdatedAt('2026-09-16T12:00:00Z', now, 'en')).toBe('yesterday');
    expect(formatMemoryUpdatedAt('2026-08-01T12:00:00Z', now, 'en')).toBe('last month');
  });

  it('returns null for missing or invalid dates', () => {
    expect(formatMemoryUpdatedAt(undefined, now)).toBeNull();
    expect(formatMemoryUpdatedAt('not a date', now)).toBeNull();
  });
});
