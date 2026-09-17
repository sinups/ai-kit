import { act, renderHook } from '@testing-library/react';
import { useStalled } from './use-stalled';

describe('AgentStatus/useStalled', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-01-01T00:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('marks the status stalled once activity is older than the threshold', () => {
    const start = Date.now();
    const { result } = renderHook(() => useStalled({ startedAt: start, lastActivityAt: start }));
    expect(result.current.isStalled).toBe(false);

    act(() => {
      jest.advanceTimersByTime(3500);
    });
    expect(result.current.isStalled).toBe(true);
    expect(result.current.elapsedMs).toBeGreaterThanOrEqual(3000);
  });

  it('never stalls while paused', () => {
    const start = Date.now();
    const { result } = renderHook(() => useStalled({ lastActivityAt: start, paused: true }));
    act(() => {
      jest.advanceTimersByTime(10_000);
    });
    expect(result.current.isStalled).toBe(false);
  });

  it('clears the interval on unmount', () => {
    const clearSpy = jest.spyOn(window, 'clearInterval');
    const { unmount } = renderHook(() => useStalled({ startedAt: Date.now() }));
    unmount();
    expect(clearSpy).toHaveBeenCalled();
    clearSpy.mockRestore();
  });
});
