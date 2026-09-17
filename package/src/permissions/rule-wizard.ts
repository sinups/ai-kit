import type { WizardErrors } from '../primitives/Wizard/wizard-state';
import { formatRule, validateRule } from './permission-rule';
import type { PermissionBehavior, PermissionRule, PermissionScope } from './types';

export interface PermissionRuleDraft {
  behavior: PermissionBehavior;
  rule: string;
  scope: PermissionScope;
}

export function createRuleDraft(
  rule?: Partial<PermissionRule>,
  defaultScope: PermissionScope = 'local'
): PermissionRuleDraft {
  return {
    behavior: rule?.behavior ?? 'allow',
    rule: rule?.toolName ? formatRule({ toolName: rule.toolName, specifier: rule.specifier }) : '',
    scope: rule?.scope && rule.scope !== 'policy' ? rule.scope : defaultScope,
  };
}

export function validateRuleStep(draft: PermissionRuleDraft): WizardErrors | null {
  const { error } = validateRule(draft.rule);
  return error ? { rule: error } : null;
}

export function validateScopeStep(draft: PermissionRuleDraft): WizardErrors | null {
  return draft.scope === 'policy' ? { scope: 'Policy rules cannot be created here' } : null;
}

export function buildPermissionRule(
  draft: PermissionRuleDraft,
  id: string,
  base?: Partial<PermissionRule>
): PermissionRule {
  const parsed = validateRule(draft.rule).rule;
  if (!parsed) {
    throw new Error('The rule is not valid');
  }
  const rule: PermissionRule = {
    id,
    behavior: draft.behavior,
    toolName: parsed.toolName,
    scope: draft.scope,
  };
  if (parsed.specifier !== undefined) {
    rule.specifier = parsed.specifier.trim();
  }
  if (base?.createdAt) {
    rule.createdAt = base.createdAt;
  }
  if (base?.source) {
    rule.source = base.source;
  }
  return rule;
}
