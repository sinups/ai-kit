import { TOOL_CATALOG } from './fixtures';
import type { AgentDraft } from './types';
import {
  createAgentDraft,
  getCopyName,
  getDestructiveTools,
  isAgentDraftEqual,
  resolveAgentTools,
  slugifyAgentName,
  summarizeTools,
  validateAgentDraft,
  validateAgentName,
} from './validate-agent';

const VALID: AgentDraft = {
  ...createAgentDraft(),
  name: 'code-reviewer',
  description: 'Use after code changes to review the diff',
  systemPrompt: 'Review the change.',
  tools: ['Read'],
};

describe('agents/validate-agent', () => {
  it('validates the name format and uniqueness', () => {
    expect(validateAgentName('code-reviewer')).toBeNull();
    expect(validateAgentName('')).toBe('Enter a name');
    expect(validateAgentName('Code')).toMatch(/lowercase/);
    expect(validateAgentName('1agent')).toMatch(/lowercase/);
    expect(validateAgentName('a')).toMatch(/lowercase/);
    expect(validateAgentName('a'.repeat(65))).toMatch(/lowercase/);
    expect(validateAgentName('researcher', ['researcher'])).toBe(
      'An agent with this name already exists'
    );
    expect(validateAgentName('', [], { nameRequired: 'Required' })).toBe('Required');
  });

  it('validates a draft', () => {
    expect(validateAgentDraft(VALID)).toEqual({});
    const errors = validateAgentDraft(
      {
        ...VALID,
        description: 'Too short',
        systemPrompt: '  ',
        tools: [],
        maxTurns: 0,
      },
      { existingNames: ['code-reviewer'] }
    );
    expect(Object.keys(errors).sort()).toEqual([
      'description',
      'maxTurns',
      'name',
      'systemPrompt',
      'tools',
    ]);
    expect(errors.description).toBe('Describe when to use the agent in at least 20 characters');
  });

  it('reports tools that are allowed and disallowed at once', () => {
    expect(
      validateAgentDraft({ ...VALID, tools: ['Read', 'Bash'], disallowedTools: ['Bash'] })
        .disallowedTools
    ).toBe('Allowed and disallowed at the same time: Bash');
    expect(validateAgentDraft({ ...VALID, tools: 'all', disallowedTools: ['Bash'] })).toEqual({});
  });

  it('summarizes tools', () => {
    expect(summarizeTools('all', TOOL_CATALOG)).toBe('All tools');
    expect(summarizeTools([], TOOL_CATALOG)).toBe('No tools');
    expect(summarizeTools(['Read'], TOOL_CATALOG)).toBe('1 tool from Built-in');
    expect(summarizeTools(['Read', 'Grep'], TOOL_CATALOG)).toBe('2 tools from Built-in');
    expect(
      summarizeTools(['Read', 'mcp__git__search_code', 'mcp__postgres__query'], TOOL_CATALOG)
    ).toBe('3 tools from 3 groups');
    expect(summarizeTools(['unknown', 'other'], TOOL_CATALOG)).toBe('2 tools');
    expect(summarizeTools('all', [], { all: 'Everything' })).toBe('Everything');
  });

  it('resolves tools and finds destructive ones', () => {
    expect(resolveAgentTools(['Read', 'Bash'], ['Bash'])).toEqual(['Read']);
    expect(resolveAgentTools('all', ['Bash'], TOOL_CATALOG)).not.toContain('Bash');
    expect(
      getDestructiveTools({ tools: ['Read', 'Bash'], disallowedTools: [] }, TOOL_CATALOG)
    ).toEqual(['Bash']);
    expect(
      getDestructiveTools({ tools: 'all', disallowedTools: ['Write', 'Bash'] }, TOOL_CATALOG)
    ).toEqual(['mcp__git__merge_pull_request', 'mcp__postgres__execute']);
  });

  it('builds slugs and copy names', () => {
    expect(slugifyAgentName('Code Reviewer!')).toBe('code-reviewer');
    expect(slugifyAgentName('  42 Crème brûlée  ')).toBe('creme-brulee');
    expect(slugifyAgentName('')).toBe('');
    expect(getCopyName('tester', [])).toBe('tester-copy');
    expect(getCopyName('tester', ['tester-copy', 'tester-copy-2'])).toBe('tester-copy-3');
  });

  it('creates drafts and compares them', () => {
    const draft = createAgentDraft({ name: 'a', tools: ['Read', 'Grep'], skills: ['x'] });
    expect(draft.model).toBe('inherit');
    expect(isAgentDraftEqual(draft, { ...draft, tools: ['Grep', 'Read'] })).toBe(true);
    expect(isAgentDraftEqual(draft, { ...draft, tools: 'all' })).toBe(false);
    expect(isAgentDraftEqual(draft, { ...draft, maxTurns: 3 })).toBe(false);
  });
});
