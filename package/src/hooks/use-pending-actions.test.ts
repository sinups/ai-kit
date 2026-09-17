import { act, renderHook } from '@testing-library/react';
import { usePendingActions } from './use-pending-actions';

describe('hooks/usePendingActions', () => {
  it('tracks pending keys and ignores repeated runs of the same key', async () => {
    let resolve: () => void = () => {};
    const action = jest.fn(() => new Promise<void>((done) => (resolve = done)));
    const { result } = renderHook(() => usePendingActions());

    let running: Promise<void> = Promise.resolve();
    act(() => {
      running = result.current.run('a', action);
    });
    expect(result.current.isPending('a')).toBe(true);
    expect(result.current.isPending('b')).toBe(false);

    await act(async () => {
      await result.current.run('a', action);
    });
    expect(action).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolve();
      await running;
    });
    expect(result.current.isPending('a')).toBe(false);
  });

  it('stores rejections or rethrows them', async () => {
    const { result } = renderHook(() => usePendingActions('Failed'));

    await act(async () => {
      await result.current.run('a', () => Promise.reject(new Error('Offline')));
    });
    expect(result.current.error).toBe('Offline');

    await act(async () => {
      await result.current.run('b', () => Promise.reject(new Error('')));
    });
    expect(result.current.error).toBe('Failed');

    act(() => result.current.clearError());
    expect(result.current.error).toBeNull();

    await act(async () => {
      await expect(
        result.current.run('c', () => Promise.reject(new Error('Shown by caller')), {
          rethrow: true,
        })
      ).rejects.toThrow('Shown by caller');
    });
    expect(result.current.error).toBeNull();
    expect(result.current.isPending('c')).toBe(false);
  });

  it('keeps errors per key', async () => {
    const { result } = renderHook(() => usePendingActions());

    await act(async () => {
      await result.current.run('stop:a', () => Promise.reject(new Error('Already exited')));
      await result.current.run('stop:b', () => Promise.reject(new Error('Not found')));
    });
    expect(result.current.getError('stop:a')).toBe('Already exited');
    expect(result.current.getError('stop:b')).toBe('Not found');
    expect(result.current.error).toBe('Not found');

    act(() => result.current.clearError('stop:b'));
    expect(result.current.getError('stop:b')).toBeNull();
    expect(result.current.getError('stop:a')).toBe('Already exited');

    await act(async () => {
      await result.current.run('stop:a', () => undefined);
    });
    expect(result.current.getError('stop:a')).toBeNull();

    act(() => result.current.clearError());
    expect(result.current.error).toBeNull();
  });
});
