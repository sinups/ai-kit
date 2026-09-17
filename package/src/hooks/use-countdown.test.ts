import { act, renderHook } from '@testing-library/react';
import { useCountdown } from './use-countdown';

describe('hooks/useCountdown', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-01-01T00:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns undefined without a target', () => {
    const { result } = renderHook(() => useCountdown(undefined));
    expect(result.current).toBeUndefined();
  });

  it('counts down to zero and stops', () => {
    const target = Date.now() + 3000;
    const { result } = renderHook(() => useCountdown(target));
    expect(result.current).toBe(3);
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(result.current).toBe(2);
    act(() => {
      jest.advanceTimersByTime(5000);
    });
    expect(result.current).toBe(0);
  });

  it('accepts a Date target', () => {
    const { result } = renderHook(() => useCountdown(new Date(Date.now() + 1500)));
    expect(result.current).toBe(2);
  });
});
