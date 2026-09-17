import type { McpServer } from './types';

export const GIT_SERVER: McpServer = {
  id: 'git',
  name: 'git',
  transport: 'http',
  status: 'connected',
  scope: 'user',
  url: 'https://git.example.com/mcp/',
  headers: [
    { id: 'git-auth', key: 'Authorization', value: 'Bearer example-token', secret: true },
    { id: 'git-toolsets', key: 'X-MCP-Toolsets', value: 'repos,issues,pull_requests' },
  ],
  version: '0.13.0',
  instructions:
    'Use issue and pull request tools for repository work. Prefer search before listing.',
  capabilities: { tools: true, resources: true, prompts: true, logging: true },
  tools: [
    {
      name: 'search_repositories',
      title: 'Search repositories',
      description: 'Find repositories by name, topic or owner using Git search syntax.',
      annotations: { readOnlyHint: true, openWorldHint: true },
      inputSchema: {
        type: 'object',
        required: ['query'],
        properties: {
          query: {
            type: 'string',
            description: 'Search query, for example `topic:mcp language:ts`',
          },
          page: { type: 'integer', minimum: 1, default: 1, description: 'Page number' },
          perPage: { type: 'integer', minimum: 1, maximum: 100, default: 30 },
        },
      },
      outputSchema: {
        type: 'object',
        properties: {
          totalCount: { type: 'integer' },
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                fullName: { type: 'string' },
                description: { type: ['string', 'null'] },
                stars: { type: 'integer' },
              },
            },
          },
        },
      },
    },
    {
      name: 'create_issue',
      title: 'Create issue',
      description: 'Open a new issue in a repository.',
      annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: true },
      inputSchema: {
        type: 'object',
        required: ['owner', 'repo', 'title'],
        properties: {
          owner: { type: 'string', description: 'Repository owner' },
          repo: { type: 'string', description: 'Repository name' },
          title: { type: 'string' },
          body: { type: 'string', description: 'Markdown body' },
          labels: { type: 'array', items: { type: 'string' } },
          assignees: { type: 'array', items: { type: 'string' } },
        },
      },
    },
    {
      name: 'merge_pull_request',
      title: 'Merge pull request',
      description: 'Merge a pull request into its base branch.',
      annotations: { destructiveHint: true, idempotentHint: false, openWorldHint: true },
      inputSchema: {
        type: 'object',
        required: ['owner', 'repo', 'pullNumber'],
        properties: {
          owner: { type: 'string' },
          repo: { type: 'string' },
          pullNumber: { type: 'integer', minimum: 1 },
          mergeMethod: { type: 'string', enum: ['merge', 'squash', 'rebase'], default: 'merge' },
        },
      },
    },
    {
      name: 'get_file_contents',
      title: 'Get file contents',
      description: 'Read a file or directory listing from a repository.',
      annotations: { readOnlyHint: true, idempotentHint: true },
      inputSchema: {
        type: 'object',
        required: ['owner', 'repo', 'path'],
        properties: {
          owner: { type: 'string' },
          repo: { type: 'string' },
          path: { type: 'string' },
          ref: { type: 'string', description: 'Branch, tag or commit SHA' },
        },
      },
    },
  ],
  resources: [
    {
      uri: 'repo://sinups/ai-kit/contents/README.md',
      name: 'README.md',
      description: 'Repository readme',
      mimeType: 'text/markdown',
    },
    {
      uri: 'repo://sinups/ai-kit/contents/package.json',
      name: 'package.json',
      mimeType: 'application/json',
    },
  ],
  prompts: [
    {
      name: 'review_pull_request',
      description: 'Review a pull request and summarize risks',
      arguments: [
        { name: 'owner', required: true },
        { name: 'repo', required: true },
        { name: 'pullNumber', description: 'Pull request number', required: true },
        { name: 'focus', description: 'Area to pay attention to' },
      ],
    },
  ],
};

export const FILESYSTEM_SERVER: McpServer = {
  id: 'filesystem',
  name: 'filesystem',
  transport: 'stdio',
  status: 'connected',
  scope: 'project',
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-filesystem', '/Users/me/projects/app'],
  version: '2025.7.1',
  capabilities: { tools: true },
  tools: [
    {
      name: 'read_text_file',
      description: 'Read the complete contents of a file as text.',
      annotations: { readOnlyHint: true },
      inputSchema: {
        type: 'object',
        required: ['path'],
        properties: {
          path: { type: 'string' },
          head: { type: 'number', description: 'Return only the first N lines' },
          tail: { type: 'number', description: 'Return only the last N lines' },
        },
      },
    },
    {
      name: 'write_file',
      description: 'Create a new file or overwrite an existing one.',
      annotations: { destructiveHint: true, idempotentHint: true },
      inputSchema: {
        type: 'object',
        required: ['path', 'content'],
        properties: { path: { type: 'string' }, content: { type: 'string' } },
      },
    },
    {
      name: 'edit_file',
      description: 'Make line-based edits to a text file and return a git-style diff.',
      annotations: { destructiveHint: true },
      inputSchema: {
        type: 'object',
        required: ['path', 'edits'],
        properties: {
          path: { type: 'string' },
          edits: {
            type: 'array',
            items: {
              type: 'object',
              required: ['oldText', 'newText'],
              properties: { oldText: { type: 'string' }, newText: { type: 'string' } },
            },
          },
          dryRun: { type: 'boolean', default: false, description: 'Preview changes using diff' },
        },
      },
    },
    {
      name: 'list_directory',
      description: 'List files and directories in a path.',
      annotations: { readOnlyHint: true },
      inputSchema: { type: 'object', required: ['path'], properties: { path: { type: 'string' } } },
    },
  ],
};

export const POSTGRES_SERVER: McpServer = {
  id: 'postgres',
  name: 'postgres',
  transport: 'stdio',
  status: 'disabled',
  scope: 'local',
  command: 'uvx',
  args: ['postgres-mcp', '--access-mode=restricted'],
  env: [
    {
      id: 'pg-uri',
      key: 'DATABASE_URI',
      value: 'postgresql://app:secret@localhost:5432/app',
      secret: true,
    },
    { id: 'pg-timeout', key: 'STATEMENT_TIMEOUT_MS', value: '5000' },
  ],
  toolCount: 8,
};

export const ISSUES_SERVER: McpServer = {
  id: 'issues',
  name: 'issues',
  transport: 'http',
  status: 'needs-auth',
  scope: 'user',
  url: 'https://issues.example.com/mcp',
  capabilities: { tools: true },
};

export const ERRORS_SERVER: McpServer = {
  id: 'errors',
  name: 'errors',
  transport: 'sse',
  status: 'error',
  scope: 'project',
  url: 'https://errors.example.com/sse',
  error: 'Connection closed: 502 Bad Gateway from https://errors.example.com/sse',
  headers: [
    { id: 'errors-token', key: 'Authorization', value: 'Bearer example-token', secret: true },
  ],
  toolCount: 16,
};

export const MCP_SERVERS: McpServer[] = [
  GIT_SERVER,
  FILESYSTEM_SERVER,
  POSTGRES_SERVER,
  ISSUES_SERVER,
  ERRORS_SERVER,
];
