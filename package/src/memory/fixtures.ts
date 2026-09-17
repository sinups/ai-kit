import type { MemoryFile } from './types';

export const MEMORY_NOW = Date.parse('2026-09-17T12:00:00Z');

export const MEMORY_FILES_FIXTURE: MemoryFile[] = [
  {
    id: 'user',
    scope: 'user',
    path: '~/.agent/AGENTS.md',
    updatedAt: '2026-09-15T09:30:00Z',
    content: `# Preferences

- Answer in Russian unless the code or the question is in English
- Prefer small pull requests with one change each
- Never add AI attribution to commits`,
  },
  {
    id: 'project',
    scope: 'project',
    path: 'AGENTS.md',
    updatedAt: '2026-09-17T11:48:00Z',
    content: `# ai-kit

Use **yarn**, not npm, in this repository.

## Checks

- \`yarn jest <path>\` for a single module
- \`npx tsc --noEmit -p .\` before a pull request
- Storybook runs on port 8271`,
  },
  {
    id: 'project-site',
    scope: 'project',
    path: 'site/AGENTS.md',
    updatedAt: '2026-09-10T16:05:00Z',
    content: `# Docs site

The site is exported as static HTML. Previews live in \`app/components/previews\`.`,
  },
  {
    id: 'local',
    scope: 'local',
    path: 'AGENTS.local.md',
    updatedAt: '2026-09-17T08:12:00Z',
    content: `Local Ollama tunnel: \`ssh -N -L 11434:127.0.0.1:11434 gpu\``,
  },
  {
    id: 'agent-reviewer',
    scope: 'agent',
    agentName: 'code-reviewer',
    path: '.agent/agent-memory/code-reviewer/MEMORY.md',
    updatedAt: '2026-09-16T18:40:00Z',
    content: `# Review notes

- The team accepts \`any\` only in test fixtures
- Flag new comments that restate the code`,
  },
  {
    id: 'agent-empty',
    scope: 'agent',
    agentName: 'test-runner',
    path: '.agent/agent-memory/test-runner/MEMORY.md',
    content: '',
  },
];
