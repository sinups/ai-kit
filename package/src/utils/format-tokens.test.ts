import { formatTokens } from './format-tokens';

describe('formatTokens', () => {
  it('keeps small numbers as is', () => {
    expect(formatTokens(0)).toBe('0');
    expect(formatTokens(999)).toBe('999');
    expect(formatTokens(-5)).toBe('0');
  });

  it('compacts thousands and millions', () => {
    expect(formatTokens(1000)).toBe('1k');
    expect(formatTokens(1234)).toBe('1.2k');
    expect(formatTokens(45_200)).toBe('45.2k');
    expect(formatTokens(200_000)).toBe('200k');
    expect(formatTokens(1_500_000)).toBe('1.5M');
  });

  it('moves to the next unit when rounding reaches it', () => {
    expect(formatTokens(99_960)).toBe('100k');
    expect(formatTokens(999_950)).toBe('1M');
    expect(formatTokens(999_499)).toBe('999k');
  });
});
