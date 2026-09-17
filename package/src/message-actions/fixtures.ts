import type { ChatMessage } from '../types';

const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000);

export const rewindConversation: ChatMessage[] = [
  {
    id: 'u1',
    role: 'user',
    createdAt: minutesAgo(60 * 26),
    parts: [{ type: 'text', text: 'Set up a login form with email and password.' }],
  },
  {
    id: 'a1',
    role: 'assistant',
    parts: [{ type: 'text', text: 'Added `LoginForm` with validation.' }],
  },
  {
    id: 'u2',
    role: 'user',
    createdAt: minutesAgo(42),
    parts: [
      {
        type: 'text',
        text: 'Store the session token in an httpOnly cookie instead of localStorage.',
      },
    ],
  },
  {
    id: 'a2',
    role: 'assistant',
    parts: [{ type: 'text', text: 'Moved the token to a cookie set by the API.' }],
  },
  {
    id: 'u3',
    role: 'user',
    createdAt: minutesAgo(7),
    parts: [{ type: 'text', text: 'Add tests for token refresh.' }],
  },
  {
    id: 'a3',
    role: 'assistant',
    parts: [{ type: 'text', text: 'Added three tests for refresh, expiry and retry.' }],
  },
];
