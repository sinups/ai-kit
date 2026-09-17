import { toDate } from './format-relative-time';
import type { SessionFilter, SessionSummary } from './types';

export interface SessionDateGroupLabels {
  pinned: string;
  today: string;
  yesterday: string;
  previous7Days: string;
  previous30Days: string;
}

export interface SessionDateGroup {
  /** `pinned`, `today`, `yesterday`, `previous-7-days`, `previous-30-days` or `YYYY-MM` */
  key: string;
  label: string;
  sessions: SessionSummary[];
}

export const DEFAULT_SESSION_GROUP_LABELS: SessionDateGroupLabels = {
  pinned: 'Pinned',
  today: 'Today',
  yesterday: 'Yesterday',
  previous7Days: 'Previous 7 days',
  previous30Days: 'Previous 30 days',
};

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function daysBefore(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() - days);
}

export function getSessionDateGroup(
  session: SessionSummary,
  now: Date = new Date(),
  locale = 'en',
  labels: SessionDateGroupLabels = DEFAULT_SESSION_GROUP_LABELS
): { key: string; label: string } {
  if (session.pinned && !session.archived) {
    return { key: 'pinned', label: labels.pinned };
  }

  const updated = toDate(session.updatedAt);
  const today = startOfDay(now);
  if (updated >= today || Number.isNaN(updated.getTime())) {
    return { key: 'today', label: labels.today };
  }
  if (updated >= daysBefore(today, 1)) {
    return { key: 'yesterday', label: labels.yesterday };
  }
  if (updated >= daysBefore(today, 7)) {
    return { key: 'previous-7-days', label: labels.previous7Days };
  }
  if (updated >= daysBefore(today, 30)) {
    return { key: 'previous-30-days', label: labels.previous30Days };
  }

  const month = String(updated.getMonth() + 1).padStart(2, '0');
  return {
    key: `${updated.getFullYear()}-${month}`,
    label: new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(updated),
  };
}

const FIXED_ORDER = ['pinned', 'today', 'yesterday', 'previous-7-days', 'previous-30-days'];

export function groupSessionsByDate(
  sessions: SessionSummary[],
  now: Date = new Date(),
  labels: Partial<SessionDateGroupLabels> = {},
  locale = 'en'
): SessionDateGroup[] {
  const merged = { ...DEFAULT_SESSION_GROUP_LABELS, ...labels };
  const groups = new Map<string, SessionDateGroup>();

  const sorted = [...sessions].sort(
    (a, b) => toDate(b.updatedAt).getTime() - toDate(a.updatedAt).getTime()
  );
  for (const session of sorted) {
    const { key, label } = getSessionDateGroup(session, now, locale, merged);
    const group = groups.get(key);
    if (group) {
      group.sessions.push(session);
    } else {
      groups.set(key, { key, label, sessions: [session] });
    }
  }

  return [...groups.values()].sort((a, b) => {
    const aFixed = FIXED_ORDER.indexOf(a.key);
    const bFixed = FIXED_ORDER.indexOf(b.key);
    if (aFixed !== -1 || bFixed !== -1) {
      return (aFixed === -1 ? Infinity : aFixed) - (bFixed === -1 ? Infinity : bFixed);
    }
    return b.key.localeCompare(a.key);
  });
}

export function matchesSessionFilter(session: SessionSummary, filter: SessionFilter): boolean {
  if (filter === 'archived') {
    return !!session.archived;
  }
  return !session.archived && (filter === 'all' || !!session.pinned);
}
