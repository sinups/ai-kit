import { formatRelativeTime } from './format-relative-time';

const NOW = new Date(2026, 8, 17, 12, 0, 0);

function ago(seconds: number) {
  return new Date(NOW.getTime() - seconds * 1000);
}

describe('sessions/formatRelativeTime', () => {
  it('returns now for less than 45 seconds either way', () => {
    expect(formatRelativeTime(ago(10), NOW)).toBe('now');
    expect(formatRelativeTime(ago(-30), NOW)).toBe('now');
  });

  it('formats past units', () => {
    expect(formatRelativeTime(ago(50), NOW)).toBe('1 minute ago');
    expect(formatRelativeTime(ago(5 * 60), NOW)).toBe('5 minutes ago');
    expect(formatRelativeTime(ago(3 * 3600), NOW)).toBe('3 hours ago');
    expect(formatRelativeTime(ago(26 * 3600), NOW)).toBe('yesterday');
    expect(formatRelativeTime(ago(3 * 86400), NOW)).toBe('3 days ago');
    expect(formatRelativeTime(ago(14 * 86400), NOW)).toBe('2 weeks ago');
    expect(formatRelativeTime(ago(90 * 86400), NOW)).toBe('3 months ago');
    expect(formatRelativeTime(ago(800 * 86400), NOW)).toBe('2 years ago');
  });

  it('formats future dates and accepts strings and numbers', () => {
    expect(formatRelativeTime(ago(-2 * 3600).toISOString(), NOW)).toBe('in 2 hours');
    expect(formatRelativeTime(ago(-8 * 86400).getTime(), NOW.getTime())).toBe('next week');
  });

  it('uses the locale and returns an empty string for invalid dates', () => {
    expect(formatRelativeTime(ago(2 * 86400), NOW, 'es')).toBe('anteayer');
    expect(formatRelativeTime('not a date', NOW)).toBe('');
  });
});
