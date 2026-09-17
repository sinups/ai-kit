import { getSessionDateGroup, groupSessionsByDate, matchesSessionFilter } from './group-sessions';
import type { SessionSummary } from './types';

const NOW = new Date(2026, 8, 17, 9, 30);

function session(id: string, updatedAt: Date, extra: Partial<SessionSummary> = {}): SessionSummary {
  return { id, title: id, createdAt: updatedAt, updatedAt, messageCount: 1, ...extra };
}

describe('getSessionDateGroup', () => {
  it('splits days at local midnight', () => {
    expect(getSessionDateGroup(session('a', new Date(2026, 8, 17, 0, 0)), NOW).key).toBe('today');
    expect(getSessionDateGroup(session('b', new Date(2026, 8, 16, 23, 59)), NOW).key).toBe(
      'yesterday'
    );
    expect(getSessionDateGroup(session('c', new Date(2026, 8, 16, 0, 0)), NOW).key).toBe(
      'yesterday'
    );
    expect(getSessionDateGroup(session('d', new Date(2026, 8, 15, 23, 59)), NOW).key).toBe(
      'previous-7-days'
    );
  });

  it('puts future dates into today', () => {
    expect(getSessionDateGroup(session('a', new Date(2026, 8, 20)), NOW).key).toBe('today');
  });

  it('uses 7 and 30 day windows and then months', () => {
    expect(getSessionDateGroup(session('a', new Date(2026, 8, 10)), NOW).key).toBe(
      'previous-7-days'
    );
    expect(getSessionDateGroup(session('b', new Date(2026, 8, 9, 23)), NOW).key).toBe(
      'previous-30-days'
    );
    expect(getSessionDateGroup(session('c', new Date(2026, 7, 18)), NOW).key).toBe(
      'previous-30-days'
    );
    expect(getSessionDateGroup(session('d', new Date(2026, 7, 17, 23)), NOW)).toEqual({
      key: '2026-08',
      label: 'August 2026',
    });
  });

  it('groups pinned sessions unless archived', () => {
    const old = new Date(2025, 0, 1);
    expect(getSessionDateGroup(session('a', old, { pinned: true }), NOW).key).toBe('pinned');
    expect(getSessionDateGroup(session('b', old, { pinned: true, archived: true }), NOW).key).toBe(
      '2025-01'
    );
  });
});

describe('groupSessionsByDate', () => {
  it('orders groups and sorts sessions by updatedAt descending', () => {
    const groups = groupSessionsByDate(
      [
        session('march', new Date(2026, 2, 3)),
        session('today-early', new Date(2026, 8, 17, 8)),
        session('july', new Date(2026, 6, 1)),
        session('pinned', new Date(2026, 1, 1), { pinned: true }),
        session('today-late', new Date(2026, 8, 17, 9)),
        session('yesterday', new Date(2026, 8, 16, 12)),
        session('dec', new Date(2025, 11, 31)),
      ],
      NOW,
      { today: 'Сегодня' }
    );

    expect(groups.map((group) => group.key)).toEqual([
      'pinned',
      'today',
      'yesterday',
      '2026-07',
      '2026-03',
      '2025-12',
    ]);
    expect(groups[1].label).toBe('Сегодня');
    expect(groups[1].sessions.map((item) => item.id)).toEqual(['today-late', 'today-early']);
  });

  it('crosses the month boundary by calendar days', () => {
    const firstOfMonth = new Date(2026, 9, 1, 10);
    const groups = groupSessionsByDate([session('a', new Date(2026, 8, 30, 22))], firstOfMonth);
    expect(groups[0].key).toBe('yesterday');
  });
});

describe('matchesSessionFilter', () => {
  const active = session('active', NOW);
  const pinned = session('pinned', NOW, { pinned: true });
  const archived = session('archived', NOW, { archived: true, pinned: true });

  it('keeps archived sessions out of all and pinned', () => {
    expect([active, pinned, archived].filter((item) => matchesSessionFilter(item, 'all'))).toEqual([
      active,
      pinned,
    ]);
    expect(
      [active, pinned, archived].filter((item) => matchesSessionFilter(item, 'pinned'))
    ).toEqual([pinned]);
    expect(
      [active, pinned, archived].filter((item) => matchesSessionFilter(item, 'archived'))
    ).toEqual([archived]);
  });
});
