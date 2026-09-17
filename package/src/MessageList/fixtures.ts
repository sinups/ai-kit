import type { ChatMessage } from '../types';

const now = new Date();

export const conversation: ChatMessage[] = [
  {
    id: 'u1',
    role: 'user',
    createdAt: now,
    parts: [{ type: 'text', text: 'Find where the auth token is refreshed and add a retry.' }],
  },
  {
    id: 'a1',
    role: 'assistant',
    parts: [
      {
        type: 'text',
        text: "I'll start by locating the refresh logic and checking how errors are handled.",
      },
      {
        type: 'tool-Grep',
        toolCallId: 'grep1',
        state: 'output-available',
        input: { pattern: 'refreshToken', path: 'src', output_mode: 'files_with_matches' },
        output: {
          results: [
            { path: 'src/auth/session.ts', line: 42 },
            { path: 'src/auth/client.ts', line: 118 },
          ],
        },
      },
      {
        type: 'tool-Read',
        toolCallId: 'read1',
        state: 'output-available',
        input: { file_path: 'src/auth/session.ts' },
        output: 'export async function refreshToken(session: Session) {\n  // ...\n}',
      },
      {
        type: 'tool-Bash',
        toolCallId: 'bash1',
        state: 'output-available',
        input: { command: 'yarn test src/auth', description: 'Run auth tests' },
        output: 'PASS src/auth/session.test.ts\nTests: 12 passed, 12 total',
      },
      {
        type: 'tool-Edit',
        toolCallId: 'edit1',
        state: 'output-available',
        input: {
          file_path: 'src/auth/session.ts',
          old_string: 'const token = await api.refresh(session.refreshToken);',
          new_string:
            'const token = await withRetry(() => api.refresh(session.refreshToken), {\n  retries: 3,\n});',
        },
        output: 'File updated',
      },
      {
        type: 'tool-Task',
        toolCallId: 'task1',
        state: 'output-available',
        input: {
          description: 'Audit error handling in auth module',
          prompt: 'Review src/auth for unhandled promise rejections',
          subagent_type: 'code-reviewer',
        },
        output: 'No unhandled rejections found. Two places could use explicit timeouts.',
      },
      {
        type: 'tool-Read',
        toolCallId: 'task1:1',
        state: 'output-available',
        input: { file_path: 'src/auth/client.ts' },
        output: 'export class AuthClient { ... }',
      },
      {
        type: 'tool-Grep',
        toolCallId: 'task1:2',
        state: 'output-available',
        input: { pattern: 'catch', path: 'src/auth' },
        output: { results: [{ path: 'src/auth/client.ts', line: 130 }] },
      },
      {
        type: 'tool-TodoWrite',
        toolCallId: 'todo1',
        state: 'output-available',
        input: {
          todos: [
            { content: 'Locate refresh logic', status: 'completed', activeForm: 'Locating' },
            { content: 'Add retry wrapper', status: 'completed', activeForm: 'Adding retry' },
            { content: 'Write regression test', status: 'in_progress', activeForm: 'Writing test' },
            { content: 'Update changelog', status: 'pending', activeForm: 'Updating changelog' },
          ],
        },
        output: { success: true },
      },
      {
        type: 'tool-PlanWrite',
        toolCallId: 'plan1',
        state: 'output-available',
        input: {
          action: 'create',
          plan: {
            id: 'auth-retry',
            title: 'Add retry to token refresh',
            summary:
              '## Goal\n\nMake token refresh resilient to transient failures.\n\n## Steps\n\n1. Wrap `api.refresh` in `withRetry`\n2. Add a regression test\n3. Document the new behaviour',
            status: 'approved',
          },
        },
        output: { ok: true },
      },
      {
        type: 'tool-mcp__server__get_user',
        toolCallId: 'mcp1',
        state: 'output-available',
        input: { userId: 'u_42' },
        output: [
          {
            type: 'text',
            text: JSON.stringify({ id: 'u_42', name: 'Ada Lovelace', role: 'admin' }),
          },
        ],
      },
      {
        type: 'text',
        text: 'Done. The refresh call now retries **three times** with exponential backoff.\n\n```ts\nconst token = await withRetry(() => api.refresh(session.refreshToken), {\n  retries: 3,\n});\n```\n\nAll 12 auth tests pass.',
      },
    ],
  },
];

export const streamingConversation: ChatMessage[] = [
  {
    id: 'u1',
    role: 'user',
    createdAt: now,
    parts: [{ type: 'text', text: 'Run the linter and fix anything it reports.' }],
  },
  {
    id: 'a1',
    role: 'assistant',
    parts: [
      { type: 'text', text: 'Running the linter now.' },
      {
        type: 'tool-Bash',
        toolCallId: 'bash-stream',
        state: 'input-available',
        input: { command: 'yarn oxlint', description: 'Run linter' },
      },
    ],
  },
];

export const pendingConversation: ChatMessage[] = [
  {
    id: 'u1',
    role: 'user',
    createdAt: now,
    parts: [{ type: 'text', text: 'What does this repository do?' }],
  },
];

export const errorConversation: ChatMessage[] = [
  ...pendingConversation,
  {
    id: 'a-err',
    role: 'assistant',
    parts: [
      {
        type: 'error',
        title: 'Request failed',
        message: 'The upstream model timed out after 60s.',
      },
    ],
  },
];

export const toolRunConversation: ChatMessage[] = [
  {
    id: 'run-u1',
    role: 'user',
    parts: [{ type: 'text', text: 'Where is the retry logic for uploads?' }],
  },
  {
    id: 'run-a1',
    role: 'assistant',
    parts: [
      {
        type: 'tool-Grep',
        toolCallId: 'run-grep-1',
        state: 'output-available',
        input: { pattern: 'retry', path: 'src/upload' },
        output: { numFiles: 4 },
      },
      {
        type: 'tool-Read',
        toolCallId: 'run-read-1',
        state: 'output-available',
        input: { file_path: 'src/upload/client.ts' },
        output: '',
      },
      {
        type: 'tool-Read',
        toolCallId: 'run-read-2',
        state: 'output-available',
        input: { file_path: 'src/upload/backoff.ts' },
        output: '',
      },
      {
        type: 'tool-Glob',
        toolCallId: 'run-glob-1',
        state: 'output-available',
        input: { pattern: 'src/upload/**/*.test.ts' },
        output: { numFiles: 2 },
      },
      {
        type: 'tool-Read',
        toolCallId: 'run-read-3',
        state: 'output-available',
        input: { file_path: 'src/upload/client.test.ts' },
        output: '',
      },
      {
        type: 'text',
        text: 'Retries live in `src/upload/backoff.ts`: exponential backoff with up to 5 attempts.',
      },
    ],
  },
];

export const compactedConversation: ChatMessage[] = [
  {
    id: 'cmp-s1',
    role: 'system',
    parts: [
      {
        type: 'compaction',
        tokensBefore: 182_400,
        tokensAfter: 12_300,
        summary:
          '- Migrated the upload client to the new API\n- Tests for backoff are green\n- Open question: keep the 5 attempt limit?',
      },
    ],
  },
  {
    id: 'cmp-u1',
    role: 'user',
    parts: [{ type: 'text', text: 'Keep 5 attempts and ship it.' }],
  },
  {
    id: 'cmp-a1',
    role: 'assistant',
    parts: [{ type: 'text', text: 'Done: the limit stays at 5 attempts.' }],
  },
];
