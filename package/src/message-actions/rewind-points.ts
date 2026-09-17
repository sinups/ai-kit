import type { ChatMessage } from '../types';
import { isTextPart } from '../utils/parts';
import type { RewindPoint, SummarizeDirection, SummarizeRequest } from './types';

const PREVIEW_LENGTH = 120;

function toDate(value: unknown): Date | undefined {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? undefined : value;
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date;
  }
  return undefined;
}

export function getMessagePreview(message: ChatMessage, maxLength = PREVIEW_LENGTH): string {
  const text = (message.parts ?? [])
    .filter(isTextPart)
    .map((part) => part.text)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > maxLength ? `${text.slice(0, maxLength - 1).trimEnd()}…` : text;
}

/** User messages the conversation can return to, newest first */
export function buildRewindPoints(messages: ChatMessage[]): RewindPoint[] {
  const points: RewindPoint[] = [];
  messages.forEach((message, index) => {
    if (message.role !== 'user') {
      return;
    }
    points.push({
      messageId: message.id,
      index,
      preview: getMessagePreview(message),
      createdAt: toDate(message.createdAt),
      messagesAfter: messages.length - index - 1,
    });
  });
  return points.reverse();
}

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

const DAY_MS = 24 * 60 * 60 * 1000;

export type RewindGroupLabels = {
  today: string;
  yesterday: string;
  earlier: string;
};

export const DEFAULT_REWIND_GROUP_LABELS: RewindGroupLabels = {
  today: 'Today',
  yesterday: 'Yesterday',
  earlier: 'Earlier',
};

const groupDateFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });

/** Day group of a rewind point: `Today`, `Yesterday`, a date, or `Earlier` when the time is unknown */
export function getRewindGroup(
  point: RewindPoint,
  now: Date = new Date(),
  labels: RewindGroupLabels = DEFAULT_REWIND_GROUP_LABELS
): string {
  if (!point.createdAt) {
    return labels.earlier;
  }
  const days = Math.round((startOfDay(now) - startOfDay(point.createdAt)) / DAY_MS);
  if (days <= 0) {
    return labels.today;
  }
  if (days === 1) {
    return labels.yesterday;
  }
  return groupDateFormatter.format(point.createdAt);
}

export function buildSummarizeRequest(
  messageId: string,
  direction: SummarizeDirection,
  context?: string
): SummarizeRequest {
  const trimmed = context?.trim();
  return trimmed ? { messageId, direction, context: trimmed } : { messageId, direction };
}
