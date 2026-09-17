import type { ContextBreakdownGroup, ContextSuggestion } from './context-breakdown';

export const CONTEXT_GROUPS: ContextBreakdownGroup[] = [
  { id: 'system', label: 'System', tokens: 3_200 },
  {
    id: 'tools',
    label: 'Tools',
    items: [
      { id: 'bash', label: 'Bash', tokens: 1_900 },
      { id: 'edit', label: 'Edit', tokens: 1_400 },
      { id: 'read', label: 'Read', tokens: 900 },
      { id: 'web', label: 'WebFetch', tokens: 700 },
    ],
  },
  {
    id: 'mcpTools',
    label: 'MCP tools',
    items: [
      { id: 'git', label: 'git', description: '41 tools', tokens: 14_800 },
      { id: 'issues', label: 'issues', description: '23 tools · unused this week', tokens: 6_300 },
      {
        id: 'postgres',
        label: 'postgres',
        description: '6 tools · unused this week',
        tokens: 3_100,
      },
      { id: 'errors', label: 'errors', description: '12 tools · unused this week', tokens: 2_700 },
    ],
  },
  {
    id: 'agents',
    label: 'Agents',
    items: [
      { id: 'code-reviewer', label: 'code-reviewer', tokens: 600 },
      { id: 'test-runner', label: 'test-runner', tokens: 450 },
    ],
  },
  {
    id: 'memory',
    label: 'Memory files',
    items: [
      { id: 'project', label: 'AGENTS.md', description: './AGENTS.md', tokens: 5_400 },
      { id: 'user', label: 'AGENTS.md', description: '~/.agent/AGENTS.md', tokens: 1_200 },
    ],
  },
  { id: 'skills', label: 'Skills', tokens: 1_100 },
  { id: 'messages', label: 'Messages', tokens: 96_000 },
];

export const CONTEXT_SUGGESTIONS: ContextSuggestion[] = [
  {
    severity: 'warning',
    title: 'Disable 3 unused MCP servers',
    description: 'issues, postgres and errors were not called this week.',
    savings: 12_100,
    action: { label: 'Review servers', onClick: () => {} },
  },
  {
    severity: 'info',
    title: 'Trim the project memory file',
    description: 'AGENTS.md repeats instructions that are already in the system prompt.',
    savings: 2_000,
  },
  {
    severity: 'critical',
    title: 'Compact the conversation',
    description: 'Messages take most of the context window.',
    savings: 70_000,
    action: { label: 'Compact', onClick: () => {} },
  },
];
