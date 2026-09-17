import type { Skill } from './types';

export const AVAILABLE_TOOLS = [
  'Read',
  'Write',
  'Edit',
  'Grep',
  'Glob',
  'Bash',
  'WebFetch',
  'WebSearch',
];

export const skills: Skill[] = [
  {
    id: 'pdf',
    name: 'pdf',
    description:
      'Extract text and tables from PDF files, fill PDF forms and merge documents. Use when the user works with PDF files.',
    source: 'builtin',
    enabled: true,
    version: '1.4.0',
    author: 'Agent Kit',
    tags: ['documents', 'forms'],
    path: '~/.agent/skills/pdf/SKILL.md',
    allowedTools: ['Read', 'Bash'],
    updatedAt: '2026-08-30T10:00:00Z',
    usageCount: 128,
    content:
      '# PDF processing\n\nUse `pdftotext` for plain extraction and `pdfplumber` for tables.\n\n## Filling forms\n\n1. Inspect the fields with `scripts/list_fields.py`.\n2. Write the values to a JSON file.\n3. Run `scripts/fill_form.py input.pdf values.json`.\n\n> Always check the output visually before sending it.',
  },
  {
    id: 'code-review',
    name: 'code-review',
    description:
      'Review a diff for correctness, security and style issues before a pull request is opened.',
    source: 'project',
    enabled: true,
    version: '0.3.1',
    tags: ['git', 'quality'],
    path: '.agent/skills/code-review/SKILL.md',
    allowedTools: ['Read', 'Grep', 'Glob'],
    updatedAt: '2026-09-12T08:30:00Z',
    usageCount: 42,
    content: '# Code review\n\nRead the diff first, then open each touched file around the change.',
  },
  {
    id: 'release-notes',
    name: 'release-notes',
    description: 'Draft release notes from merged pull requests grouped by area.',
    source: 'user',
    enabled: false,
    author: 'sam',
    tags: ['git', 'writing'],
    allowedTools: ['Bash'],
    updatedAt: '2026-07-02T15:00:00Z',
    usageCount: 5,
    content: '# Release notes\n\nUse `gh pr list --state merged` and group by label.',
  },
  {
    id: 'figma-tokens',
    name: 'figma-tokens',
    description: 'Sync design tokens from a Figma library into CSS variables.',
    source: 'plugin',
    enabled: true,
    version: '2.0.0',
    author: 'Design Tools',
    tags: ['design'],
    allowedTools: ['WebFetch', 'Write'],
    usageCount: 17,
  },
  {
    id: 'incident-runbook',
    name: 'incident-runbook',
    description:
      'Follow the on-call runbook: gather logs, open an incident channel and post status updates.',
    source: 'remote',
    enabled: false,
    version: '5',
    tags: ['ops'],
    allowedTools: ['WebFetch', 'WebSearch'],
    usageCount: 0,
  },
];
