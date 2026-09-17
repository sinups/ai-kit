import { formatDuration, formatElapsedTime } from './format-elapsed';

describe('utils/format-elapsed', () => {
  it('formats a live elapsed time, empty under a second', () => {
    expect(formatElapsedTime(400)).toBe('');
    expect(formatElapsedTime(65_000)).toBe('1m 5s');
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
