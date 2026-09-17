import { formatDuration, formatElapsedTime } from './format-elapsed';

describe('utils/format-elapsed', () => {
  it('formats a live elapsed time, empty under a second', () => {
    expect(formatElapsedTime(400)).toBe('');
    expect(formatElapsedTime(65_000)).toBe('1m 5s');
  });

  it('formats a live elapsed time exactly like a duration from a second on', () => {
    for (const ms of [1000, 45_000, 123_000, 3_725_000, 7_200_000]) {
      expect(formatElapsedTime(ms)).toBe(formatDuration(ms));
    }
    expect(formatElapsedTime(3_725_000)).toBe('1h 2m');
  });

  it('formats a duration with hours and milliseconds', () => {
    expect(formatDuration(400)).toBe('400ms');
    expect(formatDuration(-5)).toBe('0ms');
    expect(formatDuration(45_000)).toBe('45s');
    expect(formatDuration(123_000)).toBe('2m 3s');
    expect(formatDuration(120_000)).toBe('2m');
    expect(formatDuration(3_900_000)).toBe('1h 5m');
    expect(formatDuration(7_200_000)).toBe('2h');
  });
});
