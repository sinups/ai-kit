import type { ModelOption } from '../types';
import type { AgentDefinition, ToolCatalogItem } from './types';

export const AGENT_MODELS: ModelOption[] = [
  { id: 'qwen-2.5-coder-32b', name: 'Qwen 2.5 Coder', version: '32B' },
  { id: 'llama-3.3-70b', name: 'Llama 3.3', version: '70B' },
  { id: 'mistral-small-24b', name: 'Mistral Small', version: '24B' },
];

export const AGENT_SKILLS = ['code-review', 'testing', 'docs-style', 'sql', 'release-notes'];

export const TOOL_CATALOG: ToolCatalogItem[] = [
  {
    name: 'Read',
    group: 'Built-in',
    description: 'Read a file from the workspace',
    readOnly: true,
  },
  { name: 'Edit', group: 'Built-in', description: 'Replace an exact string in a file' },
  {
    name: 'Write',
    group: 'Built-in',
    description: 'Create or overwrite a file',
    destructive: true,
  },
  {
    name: 'Bash',
    group: 'Built-in',
    description: 'Run a shell command in the workspace',
    destructive: true,
  },
  {
    name: 'Grep',
    group: 'Built-in',
    description: 'Search file contents with a regex',
    readOnly: true,
  },
  { name: 'Glob', group: 'Built-in', description: 'Find files by a glob pattern', readOnly: true },
  { name: 'WebFetch', group: 'Built-in', description: 'Fetch a URL and read it', readOnly: true },
  { name: 'WebSearch', group: 'Built-in', description: 'Search the web', readOnly: true },
  {
    name: 'mcp__git__search_code',
    title: 'Search code',
    group: 'MCP: git',
    description: 'Search code across repositories',
    readOnly: true,
  },
  {
    name: 'mcp__git__get_pull_request',
    title: 'Get pull request',
    group: 'MCP: git',
    description: 'Read a pull request with its diff and review comments',
    readOnly: true,
  },
  {
    name: 'mcp__git__create_review_comment',
    title: 'Create review comment',
    group: 'MCP: git',
    description: 'Comment on a line of a pull request',
  },
  {
    name: 'mcp__git__merge_pull_request',
    title: 'Merge pull request',
    group: 'MCP: git',
    description: 'Merge a pull request into its base branch',
    destructive: true,
  },
  {
    name: 'mcp__issues__list_issues',
    title: 'List issues',
    group: 'MCP: issues',
    description: 'List issues of a team or project',
    readOnly: true,
  },
  {
    name: 'mcp__issues__create_issue',
    title: 'Create issue',
    group: 'MCP: issues',
    description: 'Create an issue with a title, description and labels',
  },
  {
    name: 'mcp__postgres__query',
    title: 'Run read-only query',
    group: 'MCP: postgres',
    description: 'Run a SELECT query against the analytics replica',
    readOnly: true,
  },
  {
    name: 'mcp__postgres__execute',
    title: 'Execute statement',
    group: 'MCP: postgres',
    description: 'Run any SQL statement, including writes and schema changes',
    destructive: true,
  },
];

export const AGENTS: AgentDefinition[] = [
  {
    id: 'agent-code-reviewer',
    name: 'code-reviewer',
    displayName: 'Code reviewer',
    description:
      'Use after writing or changing code to review the diff for bugs, security issues and missing tests before opening a pull request.',
    systemPrompt: `You are a senior engineer reviewing a change.

## Process
1. Read the diff with \`git diff\` and open every touched file.
2. Look for **correctness** bugs first, then security, then readability.
3. Report findings as a list ordered by severity.

## Rules
- Quote the exact line for every finding.
- Do not rewrite code that is not part of the change.
- Say plainly when the change looks good.`,
    model: 'qwen-2.5-coder-32b',
    tools: [
      'Read',
      'Grep',
      'Glob',
      'Bash',
      'mcp__git__get_pull_request',
      'mcp__git__create_review_comment',
    ],
    skills: ['code-review'],
    color: 'violet',
    source: 'project',
    maxTurns: 30,
    updatedAt: '2026-09-12T10:24:00Z',
  },
  {
    id: 'agent-test-runner',
    name: 'test-runner',
    displayName: 'Test runner',
    description:
      'Use proactively after code changes to run the affected test suites, read failures and fix the tests or report the root cause.',
    systemPrompt: `Run the tests related to the change and make them pass.

- Start with the narrowest command, for example \`yarn jest path/to/file\`.
- Fix the test only when the test is wrong; otherwise report the failing behavior.
- Never skip or delete a failing test.`,
    model: 'llama-3.3-70b',
    tools: ['Read', 'Edit', 'Bash', 'Grep', 'Glob'],
    skills: ['testing'],
    color: 'green',
    source: 'project',
    maxTurns: 40,
    updatedAt: '2026-09-10T16:02:00Z',
  },
  {
    id: 'agent-docs-writer',
    name: 'docs-writer',
    displayName: 'Docs writer',
    description:
      'Use when a feature needs user documentation, a README update or release notes written in the house style.',
    systemPrompt: `Write documentation for developers.

Keep sentences short, show a working example before the reference and link to related pages.`,
    model: 'inherit',
    tools: ['Read', 'Write', 'Edit', 'Glob', 'WebFetch', 'mcp__issues__list_issues'],
    skills: ['docs-style', 'release-notes'],
    color: 'blue',
    icon: '📝',
    source: 'user',
    updatedAt: '2026-08-28T09:15:00Z',
  },
  {
    id: 'agent-researcher',
    name: 'researcher',
    displayName: 'Researcher',
    description:
      'Use for open questions that need reading many files, the web or the database before an answer, without changing anything.',
    systemPrompt: `Investigate the question and answer with sources.

Cite files as \`path:line\` and web pages as links. Do not modify files.`,
    model: 'mistral-small-24b',
    tools: 'all',
    disallowedTools: [
      'Write',
      'Edit',
      'Bash',
      'mcp__git__merge_pull_request',
      'mcp__postgres__execute',
    ],
    color: 'orange',
    source: 'plugin',
    readOnly: true,
    maxTurns: 25,
  },
  {
    id: 'agent-general-purpose',
    name: 'general-purpose',
    displayName: 'General purpose',
    description:
      'General-purpose agent for researching complex questions, searching for code and executing multi-step tasks.',
    systemPrompt: `You are a general-purpose agent. Complete the task fully and report what you did.`,
    model: 'inherit',
    tools: 'all',
    source: 'builtin',
    readOnly: true,
  },
];
