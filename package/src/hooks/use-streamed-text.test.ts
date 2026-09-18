import { act, renderHook } from '@testing-library/react';
import { useStreamedText } from './use-streamed-text';

function setVisibility(state: 'visible' | 'hidden') {
  Object.defineProperty(document, 'visibilityState', { configurable: true, value: state });
}

describe('hooks/useStreamedText', () => {
  beforeEach(() => jest.useFakeTimers());

  afterEach(() => {
    jest.useRealTimers();
    setVisibility('visible');
  });

  it('commits several deltas as one frame', () => {
    const { result, rerender } = renderHook(({ text }) => useStreamedText(text), {
      initialProps: { text: 'Hel' },
    });
    expect(result.current).toBe('Hel');

    rerender({ text: 'Hello' });
    rerender({ text: 'Hello wor' });
    rerender({ text: 'Hello world' });
    expect(result.current).toBe('Hel');

    act(() => {
      jest.advanceTimersByTime(16);
    });
    expect(result.current).toBe('Hello world');
  });

  it('commits again on the next frame', () => {
    const { result, rerender } = renderHook(({ text }) => useStreamedText(text), {
      initialProps: { text: 'a' },
    });
    rerender({ text: 'ab' });
    act(() => {
      jest.advanceTimersByTime(16);
    });
    expect(result.current).toBe('ab');
    rerender({ text: 'abc' });
    expect(result.current).toBe('ab');
    act(() => {
      jest.advanceTimersByTime(16);
    });
    expect(result.current).toBe('abc');
  });

  it('commits synchronously when the stream ends', () => {
    const { result, rerender } = renderHook(
      ({ text, streaming }) => useStreamedText(text, { streaming }),
      { initialProps: { text: 'a', streaming: true } }
    );
    rerender({ text: 'answer', streaming: true });
    expect(result.current).toBe('a');
    rerender({ text: 'answer', streaming: false });
    expect(result.current).toBe('answer');
  });

  it('commits synchronously while the document is hidden', () => {
    const { result, rerender } = renderHook(({ text }) => useStreamedText(text), {
      initialProps: { text: 'a' },
    });
    rerender({ text: 'ab' });
    expect(result.current).toBe('a');

    act(() => {
      setVisibility('hidden');
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(result.current).toBe('ab');

    rerender({ text: 'abc' });
    expect(result.current).toBe('abc');
  });

  it('commits synchronously under reduced motion', () => {
    const matchMedia = window.matchMedia;
    window.matchMedia = ((query: string) => ({
      ...matchMedia(query),
      matches: query === '(prefers-reduced-motion: reduce)',
    })) as typeof window.matchMedia;
    const { result, rerender } = renderHook(({ text }) => useStreamedText(text), {
      initialProps: { text: 'a' },
    });
    rerender({ text: 'ab' });
    expect(result.current).toBe('ab');
    window.matchMedia = matchMedia;
  });

  it('returns the text unchanged while batching is off', () => {
    const { result, rerender } = renderHook(
      ({ text }) => useStreamedText(text, { enabled: false }),
      { initialProps: { text: 'a' } }
    );
    rerender({ text: 'ab' });
    expect(result.current).toBe('ab');
  });

  it('drops the pending frame on unmount', () => {
    const cancel = jest.spyOn(window, 'cancelAnimationFrame');
    const { rerender, unmount } = renderHook(({ text }) => useStreamedText(text), {
      initialProps: { text: 'a' },
    });
    rerender({ text: 'ab' });
    unmount();
    expect(cancel).toHaveBeenCalled();
    act(() => {
      jest.advanceTimersByTime(16);
    });
    cancel.mockRestore();
  });
});
