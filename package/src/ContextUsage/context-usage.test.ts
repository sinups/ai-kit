import { formatPercent, getUsageLevel, getUsageRatio } from './context-usage';

describe('context usage helpers', () => {
  it('clamps the ratio and guards against an empty total', () => {
    expect(getUsageRatio(50, 200)).toBe(0.25);
    expect(getUsageRatio(300, 200)).toBe(1);
    expect(getUsageRatio(-1, 200)).toBe(0);
    expect(getUsageRatio(10, 0)).toBe(0);
  });

  it('picks the level by thresholds', () => {
    expect(getUsageLevel(0.5)).toBe('normal');
    expect(getUsageLevel(0.8)).toBe('warning');
    expect(getUsageLevel(0.95)).toBe('danger');
    expect(getUsageLevel(0.6, 0.5, 0.7)).toBe('warning');
  });

  it('formats percents', () => {
    expect(formatPercent(0)).toBe('0%');
    expect(formatPercent(0.004)).toBe('<1%');
    expect(formatPercent(0.226)).toBe('23%');
  });
});
