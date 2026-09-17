import type { McpConfigWarning, McpDiscoveredServer, McpServerCandidate } from './types';

export const DISCOVERED_SERVERS: McpDiscoveredServer[] = [
  {
    id: 'playwright',
    name: 'playwright',
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@playwright/mcp@latest'],
    source: '.mcp.json',
  },
  {
    id: 'errors',
    name: 'errors',
    transport: 'http',
    url: 'https://errors.example.com/mcp',
    source: '.mcp.json',
  },
  {
    id: 'db',
    name: 'analytics-db',
    transport: 'stdio',
    command: 'uvx',
    args: ['postgres-mcp', '--access-mode=restricted', 'postgresql://localhost:5432/analytics'],
    source: 'packages/api/.mcp.json',
  },
];

export const IMPORT_CANDIDATES: McpServerCandidate[] = [
  {
    id: 'desktop-git',
    name: 'git',
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-git'],
  },
  {
    id: 'desktop-filesystem',
    name: 'filesystem',
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-filesystem', '/Users/me/Documents'],
  },
  { id: 'desktop-notion', name: 'notion', transport: 'http', url: 'https://mcp.notion.com/mcp' },
  {
    id: 'desktop-memory',
    name: 'memory',
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-memory'],
  },
];

export const CONFIG_WARNINGS: McpConfigWarning[] = [
  {
    file: '.mcp.json',
    path: 'mcpServers.git',
    kind: 'duplicate-name',
    message: 'git is also defined in ~/.agent/config.json; the project definition is used',
    serverName: 'git',
  },
  {
    file: '.mcp.json',
    path: 'mcpServers.errors.timeoutMs',
    kind: 'unknown-field',
    message: 'Unknown field timeoutMs is ignored',
    serverName: 'errors',
  },
  {
    file: '~/.agent/config.json',
    path: 'mcpServers.issues.url',
    kind: 'invalid-value',
    message: 'Expected an http:// or https:// URL, got issues.example.com/sse',
    serverName: 'issues',
  },
];
