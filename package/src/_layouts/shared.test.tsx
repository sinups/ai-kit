import { act, renderHook } from '@testing-library/react';
import { useLayoutChat } from './shared';

describe('useLayoutChat', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('cancels every pending reply on stop', () => {
    const { result } = renderHook(() => useLayoutChat([]));
    act(() => {
      result.current.onSend({ role: 'user', content: 'first' });
      result.current.onSend({ role: 'user', content: 'second' });
      result.current.onStop();
    });
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(result.current.messages.map((message) => message.role)).toEqual(['user', 'user']);
    expect(result.current.status).toBe('ready');
  });

  it('drops the pending reply on unmount', () => {
    const clear = jest.spyOn(global, 'clearTimeout');
    const { result, unmount } = renderHook(() => useLayoutChat([]));
    act(() => result.current.onSend({ role: 'user', content: 'hello' }));
    clear.mockClear();
    unmount();
    expect(clear).toHaveBeenCalled();
    clear.mockRestore();
  });
});
