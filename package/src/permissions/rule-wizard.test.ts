import {
  buildPermissionRule,
  createRuleDraft,
  validateRuleStep,
  validateScopeStep,
} from './rule-wizard';

describe('permissions/rule-wizard', () => {
  it('creates a draft from an optional rule', () => {
    expect(createRuleDraft()).toEqual({ behavior: 'allow', rule: '', scope: 'local' });
    expect(
      createRuleDraft({ behavior: 'deny', toolName: 'Bash', specifier: 'rm:*', scope: 'user' })
    ).toEqual({ behavior: 'deny', rule: 'Bash(rm:*)', scope: 'user' });
    expect(createRuleDraft({ toolName: 'Read', scope: 'policy' }, 'project').scope).toBe('project');
  });

  it('validates the rule and scope steps', () => {
    expect(validateRuleStep({ behavior: 'allow', rule: 'Bash(', scope: 'local' })).toEqual({
      rule: 'Close the parenthesis',
    });
    expect(validateRuleStep({ behavior: 'allow', rule: 'Bash(ls)', scope: 'local' })).toBeNull();
    expect(validateScopeStep({ behavior: 'allow', rule: 'Bash', scope: 'policy' })).not.toBeNull();
    expect(validateScopeStep({ behavior: 'allow', rule: 'Bash', scope: 'user' })).toBeNull();
  });

  it('builds a rule and keeps metadata of the edited rule', () => {
    expect(
      buildPermissionRule({ behavior: 'ask', rule: ' Bash( git push ) ', scope: 'project' }, 'r1', {
        createdAt: '2026-01-01T00:00:00Z',
        source: '.agent/settings.json',
      })
    ).toEqual({
      id: 'r1',
      behavior: 'ask',
      toolName: 'Bash',
      specifier: 'git push',
      scope: 'project',
      createdAt: '2026-01-01T00:00:00Z',
      source: '.agent/settings.json',
    });
    expect(buildPermissionRule({ behavior: 'allow', rule: 'Read', scope: 'user' }, 'r2')).toEqual({
      id: 'r2',
      behavior: 'allow',
      toolName: 'Read',
      scope: 'user',
    });
    expect(() =>
      buildPermissionRule({ behavior: 'allow', rule: 'Bash(', scope: 'user' }, 'r3')
    ).toThrow();
  });
});
