import type { HookConfig } from './types';

export const HOOK_TOOLS = [
  'Bash',
  'Read',
  'Write',
  'Edit',
  'Glob',
  'Grep',
  'WebFetch',
  'WebSearch',
  'mcp__git__create_issue',
];

export const HOOKS_FIXTURE: HookConfig[] = [
  {
    id: 'format-on-write',
    event: 'PostToolUse',
    matcher: 'Edit|Write',
    type: 'command',
    command: 'npx prettier --write "$AGENT_FILE_PATHS"',
    timeout: 30,
    scope: 'project',
  },
  {
    id: 'block-rm',
    event: 'PreToolUse',
    matcher: 'Bash',
    type: 'command',
    command: 'node .agent/hooks/block-dangerous-commands.mjs',
    scope: 'project',
  },
  {
    id: 'review-web',
    event: 'PreToolUse',
    matcher: 'WebFetch',
    type: 'prompt',
    prompt: 'Allow the fetch only when the domain is on the company allowlist.',
    scope: 'user',
    enabled: false,
  },
  {
    id: 'notify-desktop',
    event: 'Notification',
    type: 'command',
    command:
      'osascript -e \'display notification "The agent needs your input" with title "Agent"\'',
    scope: 'user',
  },
  {
    id: 'git-context',
    event: 'SessionStart',
    type: 'command',
    command: 'git status --short && git log --oneline -5',
    timeout: 10,
    scope: 'local',
  },
  {
    id: 'stop-tests',
    event: 'Stop',
    type: 'command',
    command:
      'yarn jest --onlyChanged --silent || echo "Tests are failing, fix them before finishing" >&2',
    timeout: 300,
    scope: 'project',
  },
];
