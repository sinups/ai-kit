import { formatDuration, formatElapsedTime } from './format-elapsed';

describe('utils/format-elapsed', () => {
  const ru = { hours: ' ч', minutes: ' мин', seconds: ' с', milliseconds: ' мс' };

  it('keeps the English short units by default', () => {
    expect(formatDuration(11_000)).toBe('11s');
    expect(formatDuration(123_000)).toBe('2m 3s');
    expect(formatDuration(3_900_000)).toBe('1h 5m');
    expect(formatDuration(400)).toBe('400ms');
  });

  it('reads the units of the host', () => {
    expect(formatDuration(11_000, ru)).toBe('11 с');
    expect(formatDuration(123_000, ru)).toBe('2 мин 3 с');
    expect(formatElapsedTime(5_000, { seconds: ' с' })).toBe('5 с');
    expect(formatElapsedTime(400, ru)).toBe('');
  });
});
