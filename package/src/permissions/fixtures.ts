import type { PermissionDenial, PermissionRule, WorkspaceDirectory } from './types';

export const PERMISSION_TOOLS_FIXTURE = [
  'Bash',
  'Read',
  'Edit',
  'Write',
  'Glob',
  'Grep',
  'WebFetch',
  'WebSearch',
  'mcp__git__create_issue',
  'mcp__git__list_pull_requests',
  'mcp__issues__create_issue',
];

export const PERMISSION_RULES_FIXTURE: PermissionRule[] = [
  {
    id: 'allow-test',
    behavior: 'allow',
    toolName: 'Bash',
    specifier: 'npm run test:*',
    scope: 'project',
    source: '.agent/settings.json',
  },
  {
    id: 'allow-lint',
    behavior: 'allow',
    toolName: 'Bash',
    specifier: 'npm run lint',
    scope: 'project',
    source: '.agent/settings.json',
  },
  {
    id: 'allow-read-src',
    behavior: 'allow',
    toolName: 'Read',
    specifier: 'src/**',
    scope: 'local',
    source: '.agent/settings.local.json',
  },
  {
    id: 'allow-git',
    behavior: 'allow',
    toolName: 'mcp__git',
    scope: 'user',
    source: '~/.agent/settings.json',
  },
  {
    id: 'allow-docs',
    behavior: 'allow',
    toolName: 'WebFetch',
    specifier: 'domain:docs.git.example.com',
    scope: 'session',
  },
  {
    id: 'ask-push',
    behavior: 'ask',
    toolName: 'Bash',
    specifier: 'git push:*',
    scope: 'project',
    source: '.agent/settings.json',
  },
  {
    id: 'deny-env',
    behavior: 'deny',
    toolName: 'Read',
    specifier: '.env*',
    scope: 'policy',
    source: '/Library/Application Support/AgentCLI/managed-settings.json',
  },
  {
    id: 'deny-rm',
    behavior: 'deny',
    toolName: 'Bash',
    specifier: 'rm -rf *',
    scope: 'user',
    source: '~/.agent/settings.json',
  },
];

export const PERMISSION_DENIALS_FIXTURE: PermissionDenial[] = [
  {
    id: 'denial-build',
    toolName: 'Bash',
    input: 'npm run build -- --mode production',
    reason: 'No rule allows this command',
    at: '2026-09-17T09:42:00Z',
  },
  {
    id: 'denial-fetch',
    toolName: 'WebFetch',
    input: 'https://registry.npmjs.org/@mantine/core',
    reason: 'Rejected by the user',
    at: '2026-09-17T09:31:00Z',
  },
  {
    id: 'denial-edit',
    toolName: 'Edit',
    input: 'package/src/very/long/path/that/keeps/going/to/check/truncation/index.ts',
    at: '2026-09-17T08:05:00Z',
  },
];

export const WORKSPACE_DIRECTORIES_FIXTURE: WorkspaceDirectory[] = [
  { path: '/Users/me/projects/api', scope: 'project' },
  { path: '/Users/me/projects/shared-ui', scope: 'local' },
  { path: '/opt/company/templates', scope: 'policy' },
];
