import { act, renderHook } from '@testing-library/react';
import { useStreamedText } from './use-streamed-text';

function setVisibility(state: 'visible' | 'hidden') {
  Object.defineProperty(document, 'visibilityState', { configurable: true, value: state });
}

function frames(count: number) {
  act(() => {
    jest.advanceTimersByTime(16 * count);
  });
}

describe('hooks/useStreamedText', () => {
  beforeEach(() => jest.useFakeTimers());

  afterEach(() => {
    jest.useRealTimers();
    setVisibility('visible');
  });

  it('types a burst word by word instead of showing it at once', () => {
    const answer = 'Пять мест в тарифе, продление раз в год.';
    const { result, rerender } = renderHook(({ text }) => useStreamedText(text), {
      initialProps: { text: '' },
    });

    rerender({ text: answer });
    expect(result.current).toBe('');

    frames(3);
    expect(result.current).toBe('Пять ');

    frames(3);
    expect(result.current).toBe('Пять мест в ');

    frames(60);
    expect(result.current).toBe(answer);
  });

  it('cuts only at word boundaries', () => {
    const { result, rerender } = renderHook(({ text }) => useStreamedText(text), {
      initialProps: { text: '' },
    });
    rerender({ text: 'Пять мест в тарифе' });

    for (let count = 0; count < 20; count += 1) {
      frames(1);
      expect(result.current === '' || result.current.endsWith(' ')).toBe(true);
    }
  });

  it('speeds up so that a long answer never lags far behind the stream', () => {
    const long = `${'слово '.repeat(400)}конец.`;
    const { result, rerender } = renderHook(({ text }) => useStreamedText(text), {
      initialProps: { text: '' },
    });
    rerender({ text: long });

    frames(22);
    expect(result.current.length).toBeGreaterThan(long.length / 2);

    frames(120);
    expect(result.current).toBe(long);
  });

  it('holds a word that has not arrived in full', () => {
    const { result, rerender } = renderHook(({ text }) => useStreamedText(text), {
      initialProps: { text: '' },
    });
    rerender({ text: 'Тариф Ко' });
    frames(10);
    expect(result.current).toBe('Тариф ');

    rerender({ text: 'Тариф Команда стоит' });
    frames(10);
    expect(result.current).toBe('Тариф Команда ');
  });

  it('types through a token with no spaces in it', () => {
    const address = `https://example.com/${'a'.repeat(300)}`;
    const { result, rerender } = renderHook(({ text }) => useStreamedText(text), {
      initialProps: { text: '' },
    });
    rerender({ text: address });

    frames(40);
    expect(result.current.length).toBeGreaterThan(0);
    expect(address.startsWith(result.current)).toBe(true);
  });

  it('commits the rest when the stream ends', () => {
    const { result, rerender } = renderHook(
      ({ text, streaming }) => useStreamedText(text, { streaming }),
      { initialProps: { text: 'Пять', streaming: true } }
    );
    rerender({ text: 'Пять мест в тарифе', streaming: true });
    expect(result.current).toBe('Пять');

    rerender({ text: 'Пять мест в тарифе', streaming: false });
    expect(result.current).toBe('Пять мест в тарифе');
  });

  it('starts over when the text is replaced rather than continued', () => {
    const { result, rerender } = renderHook(({ text }) => useStreamedText(text), {
      initialProps: { text: 'Первый ответ' },
    });
    rerender({ text: 'Другой ответ целиком' });
    expect(result.current).toBe('Другой ответ целиком');
  });

  it('commits synchronously while the document is hidden', () => {
    const { result, rerender } = renderHook(({ text }) => useStreamedText(text), {
      initialProps: { text: 'a' },
    });
    rerender({ text: 'a b' });
    expect(result.current).toBe('a');

    act(() => {
      setVisibility('hidden');
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(result.current).toBe('a b');

    rerender({ text: 'a b c' });
    expect(result.current).toBe('a b c');
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
    rerender({ text: 'a b' });
    expect(result.current).toBe('a b');
    window.matchMedia = matchMedia;
  });

  it('returns the text unchanged while typing is off', () => {
    const { result, rerender } = renderHook(
      ({ text }) => useStreamedText(text, { enabled: false }),
      { initialProps: { text: 'a' } }
    );
    rerender({ text: 'a b' });
    expect(result.current).toBe('a b');
  });

  it('follows the pace the host asks for', () => {
    const answer = 'Пять мест в тарифе, продление раз в год. ';
    const fast = renderHook(({ text }) => useStreamedText(text, { charsPerSecond: 1000 }), {
      initialProps: { text: '' },
    });
    const usual = renderHook(({ text }) => useStreamedText(text), { initialProps: { text: '' } });
    fast.rerender({ text: answer });
    usual.rerender({ text: answer });

    frames(3);
    expect(fast.result.current).toBe(answer);
    expect(usual.result.current.length).toBeLessThan(answer.length);
  });

  it('drops the pending frame on unmount', () => {
    const cancel = jest.spyOn(window, 'cancelAnimationFrame');
    const { rerender, unmount } = renderHook(({ text }) => useStreamedText(text), {
      initialProps: { text: 'a' },
    });
    rerender({ text: 'a b' });
    unmount();
    expect(cancel).toHaveBeenCalled();
    frames(1);
    cancel.mockRestore();
  });
});
