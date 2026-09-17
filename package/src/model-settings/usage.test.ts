import {
  formatCost,
  formatLimitValue,
  formatResetIn,
  getRatio,
  getRelativePercents,
  getUsageLevel,
  sortDailyUsage,
} from './usage';

describe('model-settings/usage', () => {
  it('computes the level from thresholds', () => {
    expect(getUsageLevel(50, 100)).toBe('normal');
    expect(getUsageLevel(75, 100)).toBe('warning');
    expect(getUsageLevel(95, 100)).toBe('danger');
    expect(getUsageLevel(60, 100, 0.5, 0.6)).toBe('danger');
    expect(getUsageLevel(10, 0)).toBe('normal');
  });

  it('clamps ratios and scales bars to the largest value', () => {
    expect(getRatio(150, 100)).toBe(1);
    expect(getRatio(-1, 100)).toBe(0);
    expect(getRelativePercents([50, 100, 0])).toEqual([50, 100, 0]);
    expect(getRelativePercents([0, 0])).toEqual([0, 0]);
    expect(getRelativePercents([1, 3])).toEqual([33.3, 100]);
  });

  it('formats costs and limit values', () => {
    expect(formatCost(12)).toBe('$12');
    expect(formatCost(12.5)).toBe('$12.50');
    expect(formatCost(0.5)).toBe('$0.50');
    expect(formatCost(3.456, 'EUR')).toBe('€3.46');
    expect(formatLimitValue(1_250_000, 'tokens')).toBe('1.3M');
    expect(formatLimitValue(420, 'requests')).toBe('420');
    expect(formatLimitValue(20, 'cost')).toBe('$20');
    expect(formatCost(12.5, 'EUR', 'de-DE')).toBe('12,50\u00a0€');
  });

  it('formats the time until reset', () => {
    const now = new Date('2026-09-17T10:00:00Z');
    expect(formatResetIn('2026-09-17T12:15:00Z', now)).toBe('2h 15m');
    expect(formatResetIn('2026-09-17T10:40:00Z', now)).toBe('40m');
    expect(formatResetIn('2026-09-19T13:00:00Z', now)).toBe('2d 3h');
    expect(formatResetIn('2026-09-17T09:00:00Z', now)).toBeNull();
    expect(formatResetIn(undefined, now)).toBeNull();
    expect(formatResetIn('2026-09-17T12:00:00Z', now)).toBe('2h');
    expect(formatResetIn('2026-09-19T10:00:00Z', now)).toBe('2d');
    expect(formatResetIn('2026-09-17T12:15:00Z', now, 'de-DE')).not.toBe('2h 15m');
  });

  it('sorts days from oldest to newest', () => {
    const days = sortDailyUsage([
      { date: '2026-09-17', tokens: 1 },
      { date: new Date('2026-09-15'), tokens: 2 },
    ]);
    expect(days.map((day) => day.tokens)).toEqual([2, 1]);
  });
});
