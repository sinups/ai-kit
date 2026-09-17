export type PermissionBehavior = 'allow' | 'ask' | 'deny';

export type PermissionScope = 'session' | 'local' | 'project' | 'user' | 'policy';

export type PermissionMode = 'default' | 'acceptEdits' | 'plan' | 'bypass';

export interface PermissionRule {
  /** Stable rule id */
  id: string;
  /** What happens when the rule matches */
  behavior: PermissionBehavior;
  /** Tool the rule applies to, for example `Bash` or `mcp__git__create_issue` */
  toolName: string;
  /** Tool-specific pattern inside the parentheses, for example `npm run test:*` */
  specifier?: string;
  /** Where the rule is stored, `policy` rules are read-only */
  scope: PermissionScope;
  /** ISO timestamp of creation */
  createdAt?: string;
  /** Where the rule came from, for example a settings file path */
  source?: string;
}

export interface PermissionDenial {
  /** Stable denial id */
  id: string;
  /** Tool whose call was denied */
  toolName: string;
  /** Command, path or other input of the denied call */
  input: string;
  /** Why the call was denied */
  reason?: string;
  /** ISO timestamp of the denial */
  at: string;
}

export interface WorkspaceDirectory {
  /** Absolute directory path */
  path: string;
  /** Where the directory is stored, `policy` directories are read-only */
  scope: PermissionScope;
}

export interface PermissionScopeMeta {
  label: string;
  description: string;
  readOnly: boolean;
}

export const PERMISSION_SCOPES: Record<PermissionScope, PermissionScopeMeta> = {
  session: {
    label: 'Session',
    description: 'Only for this session, forgotten when it ends.',
    readOnly: false,
  },
  local: {
    label: 'Local',
    description: 'This project on this machine, in .agent/settings.local.json (not committed).',
    readOnly: false,
  },
  project: {
    label: 'Project',
    description: 'Shared with the team in .agent/settings.json.',
    readOnly: false,
  },
  user: {
    label: 'User',
    description: 'All your projects, in ~/.agent/settings.json.',
    readOnly: false,
  },
  policy: {
    label: 'Policy',
    description: 'Managed by your organization and cannot be changed here.',
    readOnly: true,
  },
};

export const PERMISSION_SCOPE_ORDER: PermissionScope[] = [
  'session',
  'local',
  'project',
  'user',
  'policy',
];

export const EDITABLE_PERMISSION_SCOPES: PermissionScope[] = PERMISSION_SCOPE_ORDER.filter(
  (scope) => !PERMISSION_SCOPES[scope].readOnly
);

export interface PermissionBehaviorMeta {
  label: string;
  description: string;
  color: string;
}

export const PERMISSION_BEHAVIORS: Record<PermissionBehavior, PermissionBehaviorMeta> = {
  allow: {
    label: 'Allow',
    description: 'Run matching tool calls without asking.',
    color: 'green',
  },
  ask: {
    label: 'Ask',
    description: 'Always ask for confirmation, even when another rule allows the call.',
    color: 'yellow',
  },
  deny: {
    label: 'Deny',
    description: 'Block matching tool calls. Deny rules win over allow and ask rules.',
    color: 'red',
  },
};

export const PERMISSION_BEHAVIOR_ORDER: PermissionBehavior[] = ['allow', 'ask', 'deny'];

export interface PermissionModeMeta {
  label: string;
  description: string;
  dangerous: boolean;
}

export const PERMISSION_MODES: Record<PermissionMode, PermissionModeMeta> = {
  default: {
    label: 'Default',
    description: 'Ask before the first use of each tool that is not allowed by a rule.',
    dangerous: false,
  },
  acceptEdits: {
    label: 'Accept edits',
    description: 'Apply file edits without asking, still ask for commands and other tools.',
    dangerous: false,
  },
  plan: {
    label: 'Plan',
    description: 'Read and analyze only, no edits or commands until the plan is approved.',
    dangerous: false,
  },
  bypass: {
    label: 'Bypass',
    description: 'Skip all permission prompts. Deny rules and policy still apply.',
    dangerous: true,
  },
};

export const PERMISSION_MODE_ORDER: PermissionMode[] = ['default', 'acceptEdits', 'plan', 'bypass'];
