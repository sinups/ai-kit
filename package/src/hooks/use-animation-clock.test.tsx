import React from 'react';
import { act, render, screen } from '@testing-library/react';
import {
  getAnimationClockSubscriberCount,
  isAnimationClockRunning,
  useAnimationTime,
} from './use-animation-clock';

function Ticker({ label, ...options }: { label: string } & Parameters<typeof useAnimationTime>[0]) {
  const now = useAnimationTime({ ...options });
  return <span data-testid={label}>{now}</span>;
}

function setReducedMotion(matches: boolean) {
  window.matchMedia = jest.fn().mockImplementation((query: string) => ({
    matches: matches && query === '(prefers-reduced-motion: reduce)',
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }));
}

function setHidden(hidden: boolean) {
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    get: () => (hidden ? 'hidden' : 'visible'),
  });
  document.dispatchEvent(new Event('visibilitychange'));
}

describe('hooks/use-animation-clock', () => {
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    jest.useFakeTimers();
    setReducedMotion(false);
  });

  afterEach(() => {
    jest.useRealTimers();
    window.matchMedia = originalMatchMedia;
  });

  it('drives every consumer from one frame loop and one timestamp', () => {
    const rafSpy = jest.spyOn(window, 'requestAnimationFrame');
    render(
      <>
        <Ticker label="a" />
        <Ticker label="b" />
        <Ticker label="c" />
      </>
    );
    expect(getAnimationClockSubscriberCount()).toBe(3);
    const framesAfterMount = rafSpy.mock.calls.length;
    expect(framesAfterMount).toBeLessThanOrEqual(1);

    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(screen.getByTestId('a').textContent).toBe(screen.getByTestId('b').textContent);
    expect(screen.getByTestId('b').textContent).toBe(screen.getByTestId('c').textContent);

    const framesPerConsumer = (rafSpy.mock.calls.length - framesAfterMount) / 3;
    expect(rafSpy.mock.calls.length - framesAfterMount).toBeLessThanOrEqual(
      Math.ceil(framesPerConsumer) * 3
    );
    expect(framesPerConsumer).toBeLessThan(100 / 16);
    rafSpy.mockRestore();
  });

  it('stops the loop when every consumer unmounts', () => {
    const view = render(<Ticker label="a" />);
    act(() => {
      jest.advanceTimersByTime(50);
    });
    expect(isAnimationClockRunning()).toBe(true);
    view.unmount();
    expect(getAnimationClockSubscriberCount()).toBe(0);
    expect(isAnimationClockRunning()).toBe(false);
  });

  it('stops while the document is hidden and resumes when it comes back', () => {
    render(<Ticker label="a" />);
    act(() => {
      jest.advanceTimersByTime(50);
    });
    const beforeHide = screen.getByTestId('a').textContent;

    act(() => {
      setHidden(true);
      jest.advanceTimersByTime(1000);
    });
    expect(isAnimationClockRunning()).toBe(false);
    expect(screen.getByTestId('a').textContent).toBe(beforeHide);

    act(() => {
      setHidden(false);
      jest.advanceTimersByTime(50);
    });
    expect(isAnimationClockRunning()).toBe(true);
    expect(Number(screen.getByTestId('a').textContent)).toBeGreaterThan(Number(beforeHide));
  });

  it('is inert under prefers-reduced-motion unless the consumer opts out', () => {
    setReducedMotion(true);
    render(<Ticker label="a" />);
    const initial = screen.getByTestId('a').textContent;
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    expect(getAnimationClockSubscriberCount()).toBe(0);
    expect(isAnimationClockRunning()).toBe(false);
    expect(screen.getByTestId('a').textContent).toBe(initial);
  });

  it('keeps ticking for time readouts that opt out of reduced motion', () => {
    setReducedMotion(true);
    render(<Ticker label="a" respectReducedMotion={false} intervalMs={1000} />);
    const initial = screen.getByTestId('a').textContent;
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    expect(getAnimationClockSubscriberCount()).toBe(1);
    expect(Number(screen.getByTestId('a').textContent)).toBeGreaterThan(Number(initial));
  });

  it('does not subscribe while inactive', () => {
    render(<Ticker label="a" active={false} />);
    expect(getAnimationClockSubscriberCount()).toBe(0);
  });
});
