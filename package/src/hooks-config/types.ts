export type HookEvent =
  | 'PreToolUse'
  | 'PostToolUse'
  | 'UserPromptSubmit'
  | 'Notification'
  | 'Stop'
  | 'SubagentStop'
  | 'SessionStart'
  | 'SessionEnd'
  | 'PreCompact';

export type HookType = 'command' | 'prompt';

export type HookScope = 'user' | 'project' | 'local';

export interface HookConfig {
  /** Stable hook identifier */
  id: string;
  /** Event that runs the hook */
  event: HookEvent;
  /** Tool name pattern: an exact name, a regular expression or `*`; only for events that support matchers */
  matcher?: string;
  /** `command` runs a shell command, `prompt` asks a model */
  type: HookType;
  /** Shell command for `command` hooks */
  command?: string;
  /** Prompt for `prompt` hooks */
  prompt?: string;
  /** Timeout in seconds */
  timeout?: number;
  /** Settings file the hook is stored in */
  scope: HookScope;
  /** Hooks are enabled unless set to `false` */
  enabled?: boolean;
}

export interface HookEventMeta {
  /** Event name */
  event: HookEvent;
  /** Short English label */
  label: string;
  /** When the event fires and what the hook can do */
  description: string;
  /** Whether hooks of the event are filtered by a tool matcher */
  supportsMatcher: boolean;
  /** Example of the JSON the hook receives on stdin */
  examplePayload: Record<string, unknown>;
}

export type HookEventText = Pick<HookEventMeta, 'label' | 'description'>;

/** Per-event overrides of the English event label and description */
export type HookEventTextOverrides = Partial<Record<HookEvent, Partial<HookEventText>>>;

export interface HookScopeMeta {
  /** Scope name */
  scope: HookScope;
  /** Short English label */
  label: string;
  /** Where the hook is stored and who it applies to */
  description: string;
}

const BASE_PAYLOAD = {
  session_id: 'abc123',
  cwd: '/home/user/app',
};

export const HOOK_EVENTS: Record<HookEvent, HookEventMeta> = {
  PreToolUse: {
    event: 'PreToolUse',
    label: 'Before tool use',
    description: 'Runs before a tool call and can block it or change its input.',
    supportsMatcher: true,
    examplePayload: {
      ...BASE_PAYLOAD,
      hook_event_name: 'PreToolUse',
      tool_name: 'Bash',
      tool_input: { command: 'npm run test' },
    },
  },
  PostToolUse: {
    event: 'PostToolUse',
    label: 'After tool use',
    description: 'Runs after a tool call succeeds, for example to format or lint changed files.',
    supportsMatcher: true,
    examplePayload: {
      ...BASE_PAYLOAD,
      hook_event_name: 'PostToolUse',
      tool_name: 'Write',
      tool_input: { file_path: '/home/user/app/src/index.ts', content: '...' },
      tool_response: { success: true },
    },
  },
  UserPromptSubmit: {
    event: 'UserPromptSubmit',
    label: 'Prompt submitted',
    description:
      'Runs when the user sends a prompt, before the agent sees it; can add context or block it.',
    supportsMatcher: false,
    examplePayload: {
      ...BASE_PAYLOAD,
      hook_event_name: 'UserPromptSubmit',
      prompt: 'Fix the failing test',
    },
  },
  Notification: {
    event: 'Notification',
    label: 'Notification',
    description: 'Runs when the agent needs attention, for example to approve a tool call.',
    supportsMatcher: false,
    examplePayload: {
      ...BASE_PAYLOAD,
      hook_event_name: 'Notification',
      message: 'The agent needs your permission to use Bash',
    },
  },
  Stop: {
    event: 'Stop',
    label: 'Agent stopped',
    description: 'Runs when the agent finishes responding; can ask it to continue.',
    supportsMatcher: false,
    examplePayload: { ...BASE_PAYLOAD, hook_event_name: 'Stop' },
  },
  SubagentStop: {
    event: 'SubagentStop',
    label: 'Subagent stopped',
    description: 'Runs when a subagent finishes its task.',
    supportsMatcher: false,
    examplePayload: { ...BASE_PAYLOAD, hook_event_name: 'SubagentStop' },
  },
  SessionStart: {
    event: 'SessionStart',
    label: 'Session started',
    description: 'Runs when a session starts or resumes; its output is added to the context.',
    supportsMatcher: false,
    examplePayload: { ...BASE_PAYLOAD, hook_event_name: 'SessionStart', source: 'startup' },
  },
  SessionEnd: {
    event: 'SessionEnd',
    label: 'Session ended',
    description: 'Runs when a session ends, for example to clean up or save logs.',
    supportsMatcher: false,
    examplePayload: { ...BASE_PAYLOAD, hook_event_name: 'SessionEnd', reason: 'exit' },
  },
  PreCompact: {
    event: 'PreCompact',
    label: 'Before compaction',
    description: 'Runs before the conversation is compacted to free up context.',
    supportsMatcher: false,
    examplePayload: {
      ...BASE_PAYLOAD,
      hook_event_name: 'PreCompact',
      trigger: 'auto',
    },
  },
};

export const HOOK_EVENT_ORDER: HookEvent[] = [
  'PreToolUse',
  'PostToolUse',
  'UserPromptSubmit',
  'Notification',
  'Stop',
  'SubagentStop',
  'SessionStart',
  'SessionEnd',
  'PreCompact',
];

export const HOOK_SCOPES: Record<HookScope, HookScopeMeta> = {
  user: {
    scope: 'user',
    label: 'User',
    description: 'Stored in ~/.agent/settings.json and applies to all your projects.',
  },
  project: {
    scope: 'project',
    label: 'Project',
    description: 'Stored in .agent/settings.json and shared with everyone on the project.',
  },
  local: {
    scope: 'local',
    label: 'Local',
    description: 'Stored in .agent/settings.local.json, only on this machine and not committed.',
  },
};

export const HOOK_SCOPE_ORDER: HookScope[] = ['user', 'project', 'local'];

export type HookScopeText = Pick<HookScopeMeta, 'label' | 'description'>;

/** Per-scope overrides of the English scope label and description */
export type HookScopeTextOverrides = Partial<Record<HookScope, Partial<HookScopeText>>>;
