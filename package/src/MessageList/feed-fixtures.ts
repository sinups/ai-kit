import type { ChatMessage } from '../types';

const paragraph = (topic: string, n: number) =>
  `### ${topic} ${n}\n\nThe refresh token is rotated on every use, so a retry must read the latest token from the store instead of reusing the one captured before the request. Otherwise the second attempt sends a revoked token and the server answers 401.`;

export const longAnswer = (topic: string, sections = 8) =>
  Array.from({ length: sections }, (_, i) => paragraph(topic, i + 1)).join('\n\n');

export const longConversation: ChatMessage[] = [
  {
    id: 'u1',
    role: 'user',
    parts: [{ type: 'text', text: 'Why does the token refresh fail after a retry?' }],
  },
  { id: 'a1', role: 'assistant', parts: [{ type: 'text', text: longAnswer('Cause') }] },
  {
    id: 'u2',
    role: 'user',
    parts: [{ type: 'text', text: 'How should the retry read the token then?' }],
  },
  { id: 'a2', role: 'assistant', parts: [{ type: 'text', text: longAnswer('Fix') }] },
];

export const feedConversation: ChatMessage[] = [
  { id: 'u1', role: 'user', parts: [{ type: 'text', text: 'Fix the flaky auth tests' }] },
  {
    id: 's1',
    role: 'system',
    parts: [
      {
        type: 'hook-activity',
        event: 'UserPromptSubmit',
        status: 'done',
        hooks: [{ name: 'inject-branch-context.sh', durationMs: 340 }],
      },
    ],
  },
  {
    id: 'a1',
    role: 'assistant',
    parts: [
      { type: 'context-event', kind: 'memory', label: 'AGENTS.md', detail: '2.4k tokens' },
      {
        type: 'context-event',
        kind: 'directory',
        label: 'src/auth',
        detail: '4 files',
        items: ['session.ts', 'client.ts', 'refresh.ts', 'refresh.test.ts'],
      },
      { type: 'context-event', kind: 'skill', label: 'testing-patterns' },
      {
        type: 'hook-activity',
        event: 'PreToolUse',
        status: 'blocked',
        reason: 'Editing files under src/auth/keys is not allowed',
        hooks: [
          { name: 'protect-keys.sh', durationMs: 80, error: 'path matches src/auth/keys/**' },
        ],
      },
      { type: 'context-event', kind: 'diagnostics', label: 'refresh.test.ts', detail: '2 errors' },
      { type: 'text', text: 'The tests shared a fake clock; each test now creates its own.' },
      { type: 'hook-activity', event: 'PostToolUse', status: 'running' },
      {
        type: 'turn-summary',
        durationMs: 123_000,
        tokens: 40_000,
        tokenBudget: 100_000,
        backgroundTasks: 2,
      },
    ],
  },
];

export const planSummary = `## Goal
Retry token refresh with backoff instead of logging the user out.

## Steps
1. Extract \`refreshToken\` into \`src/auth/refresh.ts\`
2. Wrap the request in \`withRetry\` (3 attempts, exponential backoff)
3. Treat \`401\` as final, retry only network errors and \`5xx\`
4. Read the latest token from the store before each attempt
5. Emit \`auth:refresh-failed\` after the last attempt
6. Add tests for success, retry and final failure

## Risks
- Parallel requests may trigger several refreshes
- Backoff must stay under the 10s request timeout`;

export const longUserText = Array.from(
  { length: 80 },
  (_, i) =>
    `[2026-09-17 10:${String(i % 60).padStart(2, '0')}] ERROR refresh failed: 401 (attempt ${i + 1})`
).join('\n');
