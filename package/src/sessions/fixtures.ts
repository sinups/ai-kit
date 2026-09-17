import { compactedConversation, conversation } from '../MessageList/fixtures';
import type { ChatMessage } from '../types';
import type { SessionSummary } from './types';

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

export function createSessionFixtures(now: Date = new Date()): SessionSummary[] {
  const at = (offset: number) => new Date(now.getTime() - offset);
  return [
    {
      id: 'auth-retry',
      title: 'Add retry to token refresh',
      preview: 'Done. The refresh call now retries three times with exponential backoff.',
      createdAt: at(3 * HOUR),
      updatedAt: at(12 * 60_000),
      messageCount: 14,
      model: 'qwen-2.5-coder-32b',
      branch: 'fix/auth-retry',
      tokenCount: 48_210,
      cost: 0.84,
      tags: ['auth', 'bugfix'],
    },
    {
      id: 'release-notes',
      title: 'Draft release notes for 2.4',
      preview: 'Here is a grouped changelog with breaking changes first.',
      createdAt: at(30 * DAY),
      updatedAt: at(2 * DAY),
      messageCount: 32,
      model: 'llama-3.3-70b',
      pinned: true,
      tags: ['docs'],
    },
    {
      id: 'flaky-e2e',
      title: 'Investigate flaky checkout e2e test',
      preview: 'The race comes from the payment iframe loading after the submit click.',
      createdAt: at(5 * HOUR),
      updatedAt: at(4 * HOUR),
      messageCount: 21,
      model: 'llama-3.3-70b',
      branch: 'test/checkout-race',
      tokenCount: 31_900,
      cost: 0.41,
    },
    {
      id: 'upload-backoff',
      title: 'Migrate upload client to the new API',
      preview: 'Keep 5 attempts and ship it.',
      createdAt: at(DAY + 6 * HOUR),
      updatedAt: at(DAY + 2 * HOUR),
      messageCount: 58,
      model: 'qwen-2.5-coder-32b',
      tokenCount: 182_400,
      cost: 3.12,
    },
    {
      id: 'sql-perf',
      title: 'Speed up the monthly report query',
      preview: 'An index on (account_id, created_at) removes the sequential scan.',
      createdAt: at(4 * DAY),
      updatedAt: at(4 * DAY),
      messageCount: 9,
      model: 'mistral-small-24b',
      tags: ['database'],
    },
    {
      id: 'onboarding-copy',
      title: 'Rewrite onboarding copy',
      preview: 'Shorter headings, one action per screen.',
      createdAt: at(12 * DAY),
      updatedAt: at(12 * DAY),
      messageCount: 17,
      model: 'llama-3.3-70b',
    },
    {
      id: 'k8s-limits',
      title: 'Tune Kubernetes memory limits for the worker pool',
      preview: 'Requests at 512Mi and limits at 1Gi keep OOM kills away without overcommitting.',
      createdAt: at(48 * DAY),
      updatedAt: at(47 * DAY),
      messageCount: 26,
      model: 'qwen-2.5-coder-32b',
      tags: ['infra'],
    },
    {
      id: 'old-spike',
      title: 'Spike: websocket transport',
      preview: 'Server-sent events are enough for the current traffic.',
      createdAt: at(80 * DAY),
      updatedAt: at(80 * DAY),
      messageCount: 6,
      archived: true,
    },
  ];
}

export const sessionConversation: ChatMessage[] = [
  ...conversation,
  {
    id: 's-u2',
    role: 'user',
    createdAt: new Date(2026, 8, 17, 10, 5),
    parts: [
      { type: 'text', text: 'Here is the failing trace from staging.' },
      { type: 'file', filename: 'staging-trace.log', mediaType: 'text/plain', size: 18_240 },
    ],
  },
  {
    id: 's-a2',
    role: 'assistant',
    createdAt: new Date(2026, 8, 17, 10, 6),
    parts: [
      {
        type: 'reasoning',
        text: 'The trace shows a 429 before the retry, so the backoff has to respect Retry-After.',
      },
      { type: 'error', title: 'Rate limited', message: 'The staging API returned 429.' },
      {
        type: 'text',
        text: 'The staging API rate-limited the refresh call. I will honour `Retry-After` in the backoff.',
      },
    ],
  },
  ...compactedConversation,
];
