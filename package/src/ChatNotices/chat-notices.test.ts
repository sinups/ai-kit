import { formatAwayDuration, formatSpend } from './chat-notices';

describe('ChatNotices/chat-notices', () => {
  it('formats away durations', () => {
    expect(formatAwayDuration(10_000)).toBe('1m');
    expect(formatAwayDuration(45 * 60_000)).toBe('45m');
    expect(formatAwayDuration(3.5 * 3_600_000)).toBe('3h');
    expect(formatAwayDuration(50 * 3_600_000)).toBe('2d');
  });

  it('formats spend in an explicit locale', () => {
    expect(formatSpend(5.2)).toBe('$5.20');
    expect(formatSpend(12, 'EUR', 'de')).toMatch(/^12,00\s€$/);
  });
});
