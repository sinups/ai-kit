import type { ChatMessage } from '../types';
import {
  buildSummarizeRequest,
  buildRewindPoints,
  getMessagePreview,
  getRewindGroup,
} from './rewind-points';

const messages: ChatMessage[] = [
  {
    id: 'u1',
    role: 'user',
    createdAt: '2026-09-15T10:00:00',
    parts: [{ type: 'text', text: 'First\n\nquestion' }],
  },
  { id: 'a1', role: 'assistant', parts: [{ type: 'text', text: 'Answer' }] },
  { id: 'u2', role: 'user', createdAt: new Date(2026, 8, 17, 9), parts: [] },
  { id: 'a2', role: 'assistant', parts: [] },
  { id: 'a3', role: 'assistant', parts: [] },
];

describe('rewind-points', () => {
  it('lists user messages newest first with the number of messages after them', () => {
    const points = buildRewindPoints(messages);
    expect(points.map((point) => [point.messageId, point.index, point.messagesAfter])).toEqual([
      ['u2', 2, 2],
      ['u1', 0, 4],
    ]);
    expect(points[1].preview).toBe('First question');
    expect(points[1].createdAt).toBeInstanceOf(Date);
  });

  it('truncates long previews', () => {
    const long: ChatMessage = {
      id: 'x',
      role: 'user',
      parts: [{ type: 'text', text: 'a'.repeat(50) }],
    };
    expect(getMessagePreview(long, 10)).toBe(`${'a'.repeat(9)}…`);
  });

  it('groups points by day', () => {
    const now = new Date(2026, 8, 17, 18);
    const [today, older] = buildRewindPoints(messages);
    expect(getRewindGroup(today, now)).toBe('Today');
    expect(getRewindGroup(older, now)).toBe('Sep 15');
    expect(getRewindGroup({ ...older, createdAt: new Date(2026, 8, 16, 23) }, now)).toBe(
      'Yesterday'
    );
    expect(getRewindGroup({ ...older, createdAt: undefined }, now)).toBe('Earlier');
  });
});

describe('message-actions/buildSummarizeRequest', () => {
  it('trims the context and omits it when empty', () => {
    expect(buildSummarizeRequest('u1', 'from', '  keep tests ')).toEqual({
      messageId: 'u1',
      direction: 'from',
      context: 'keep tests',
    });
    expect(buildSummarizeRequest('u1', 'up-to', '   ')).toEqual({
      messageId: 'u1',
      direction: 'up-to',
    });
    expect(buildSummarizeRequest('u1', 'up-to')).toEqual({ messageId: 'u1', direction: 'up-to' });
  });
});
