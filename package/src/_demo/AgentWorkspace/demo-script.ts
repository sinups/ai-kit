import type { ElicitationRequestedSchema } from '../../elicitation/elicitation-schema';
import type { CompletionSource } from '../../input/use-completion-items';
import type { Plan } from '../../tools/PlanTool';
import type { ChatMessage, MessagePart } from '../../types';

export type DemoScenario = 'explore' | 'elicitation' | 'plan' | 'error';

export const ELICITATION_TOOL = 'mcp__deploy-server__elicitation';
export const PLAN_APPROVAL_TOOL = 'PlanApproval';

export const DEMO_SCENARIO_ORDER: DemoScenario[] = ['explore', 'elicitation', 'plan', 'error'];

const SCENARIO_KEYWORDS: [DemoScenario, RegExp][] = [
  ['elicitation', /deploy|elicit|release/i],
  ['plan', /plan|refactor/i],
  ['error', /error|fail|offline/i],
  ['explore', /test|find|search|read/i],
];

export function pickScenario(prompt: string, turn: number): DemoScenario {
  const match = SCENARIO_KEYWORDS.find(([, pattern]) => pattern.test(prompt));
  return match ? match[0] : DEMO_SCENARIO_ORDER[turn % DEMO_SCENARIO_ORDER.length];
}

export const DEPLOY_SCHEMA: ElicitationRequestedSchema = {
  type: 'object',
  properties: {
    environment: {
      type: 'string',
      title: 'Environment',
      oneOf: [
        { const: 'staging', title: 'Staging' },
        { const: 'production', title: 'Production' },
      ],
    },
    replicas: { type: 'integer', title: 'Replicas', minimum: 1, maximum: 10, default: 2 },
    notify: { type: 'boolean', title: 'Notify the team', default: true },
  },
  required: ['environment'],
};

export const DEMO_PLAN: Plan = {
  id: 'token-refresh',
  title: 'Retry token refresh with backoff',
  summary: [
    '## Goal',
    'Refresh failures should retry instead of logging the user out.',
    '',
    '## Steps',
    '1. Extract `refreshToken` into `src/auth/refresh.ts`',
    '2. Wrap the request in `withRetry` (3 attempts, exponential backoff)',
    '3. Cover the retry path with unit tests',
    '4. Log the final failure with the request id',
  ].join('\n'),
};

export const EXPLORE_ANSWER =
  'The flaky test comes from `refreshToken` racing with the session timer. I ran the suite: **42 passed**. The fix is to await the refresh before scheduling the next timer.';

export const ELICITATION_ANSWER =
  'Deployment is queued. I will post the rollout status here when the health checks pass.';

export const PLAN_ANSWER =
  'Plan approved. I will start with extracting `refreshToken` and keep the public API unchanged.';

export const RETRY_ANSWER =
  'Back online. The retry succeeded and the conversation continues from where it stopped.';

export function createUserMessage(id: string, text: string): ChatMessage {
  return { id, role: 'user', parts: [{ type: 'text', text }], createdAt: new Date() };
}

export function createExploreParts(): MessagePart[] {
  const files = ['src/auth/session.ts', 'src/auth/refresh.ts', 'src/auth/session.test.ts'];
  return [
    { type: 'text', text: 'Let me look at the auth module first.' },
    ...files.map((path, index) => ({
      type: 'tool-Read',
      toolCallId: `read-${index}`,
      state: 'output-available',
      input: { file_path: path },
      output: `// ${path}`,
    })),
    {
      type: 'tool-Grep',
      toolCallId: 'grep-0',
      state: 'output-available',
      input: { pattern: 'refreshToken', path: 'src' },
      output: 'src/auth/session.ts:42\nsrc/auth/refresh.ts:8',
    },
  ];
}

export function createConversationHistory(): ChatMessage[] {
  return [
    createUserMessage('history-user', 'Why does the checkout e2e test fail sometimes?'),
    {
      id: 'history-assistant',
      role: 'assistant',
      parts: [
        { type: 'text', text: 'Checking the test and the payment iframe.' },
        {
          type: 'tool-Read',
          toolCallId: 'history-read-0',
          state: 'output-available',
          input: { file_path: 'e2e/checkout.spec.ts' },
        },
        {
          type: 'tool-Read',
          toolCallId: 'history-read-1',
          state: 'output-available',
          input: { file_path: 'src/checkout/PaymentFrame.tsx' },
        },
        {
          type: 'tool-Glob',
          toolCallId: 'history-glob',
          state: 'output-available',
          input: { pattern: 'e2e/**/*.spec.ts' },
        },
        {
          type: 'text',
          text: 'The submit click happens before the payment iframe finishes loading. Waiting for the `ready` event fixes the race.',
        },
      ],
    },
  ];
}

export const DEMO_AGENTS = [
  { value: 'code-reviewer', label: 'code-reviewer', description: 'Reviews diffs before merge' },
  { value: 'test-runner', label: 'test-runner', description: 'Runs and fixes failing tests' },
  { value: 'docs-writer', label: 'docs-writer', description: 'Writes and updates docs' },
];

export const DEMO_COMMANDS = [
  { value: 'review', label: '/review', description: 'Review the current changes' },
  { value: 'plan', label: '/plan', description: 'Draft a plan before editing' },
  { value: 'deploy', label: '/deploy', description: 'Ask an MCP server to deploy' },
  { value: 'compact', label: '/compact', description: 'Summarize the conversation' },
  { value: 'error', label: '/error', description: 'Simulate a failed request' },
];

export const DEMO_COMPLETIONS: CompletionSource[] = [
  { trigger: '/', items: DEMO_COMMANDS },
  { trigger: '@', items: DEMO_AGENTS },
];

export function splitIntoChunks(text: string): string[] {
  return text.match(/\S+\s*/g) ?? [text];
}
