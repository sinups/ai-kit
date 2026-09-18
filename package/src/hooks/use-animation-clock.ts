import { useEffect, useMemo, useState } from 'react';
import { useReducedMotion } from '@mantine/hooks';

type ClockListener = (now: number) => void;

interface Subscriber {
  intervalMs: number;
  lastNotifiedAt: number;
  listener: ClockListener;
}

const subscribers = new Set<Subscriber>();
const epoch = Date.now();

let frameId: number | null = null;
let visibilityBound = false;

function isHidden(): boolean {
  return typeof document !== 'undefined' && document.visibilityState === 'hidden';
}

function stopLoop() {
  if (frameId !== null) {
    cancelAnimationFrame(frameId);
    frameId = null;
  }
}

function startLoop() {
  if (frameId !== null || subscribers.size === 0 || isHidden()) {
    return;
  }
  if (typeof requestAnimationFrame !== 'function') {
    return;
  }
  frameId = requestAnimationFrame(onFrame);
}

function onFrame() {
  frameId = null;
  const now = Date.now();
  for (const subscriber of subscribers) {
    if (now - subscriber.lastNotifiedAt >= subscriber.intervalMs) {
      subscriber.lastNotifiedAt = now;
      subscriber.listener(now);
    }
  }
  startLoop();
}

function onVisibilityChange() {
  if (isHidden()) {
    stopLoop();
    return;
  }
  for (const subscriber of subscribers) {
    subscriber.lastNotifiedAt = 0;
  }
  startLoop();
}

/**
 * Subscribes to the single shared frame loop. `listener` receives the same timestamp as every other
 * subscriber woken by that frame, which is what keeps independent indicators in step.
 */
export function subscribeToAnimationTime(
  listener: ClockListener,
  intervalMs: number = 0
): () => void {
  const subscriber: Subscriber = { intervalMs, lastNotifiedAt: 0, listener };
  subscribers.add(subscriber);
  if (!visibilityBound && typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', onVisibilityChange);
    visibilityBound = true;
  }
  startLoop();
  return () => {
    subscribers.delete(subscriber);
    if (subscribers.size === 0) {
      stopLoop();
    }
  };
}

/** Number of live subscribers of the shared loop, for tests */
export function getAnimationClockSubscriberCount(): number {
  return subscribers.size;
}

/** Whether the shared loop currently has a frame scheduled, for tests */
export function isAnimationClockRunning(): boolean {
  return frameId !== null;
}

// Named `...Time` and not `...Clock`: esbuild-jest routes any file whose text contains `ock` before
// a paren through a babel path that cannot resolve its plugins, and the suite then fails to run.
export interface UseAnimationTimeOptions {
  /** Shortest gap between ticks delivered to this consumer in ms, every frame by default */
  intervalMs?: number;
  /** Ticking stops while `false`, `true` by default */
  active?: boolean;
  /** Stops ticking under `prefers-reduced-motion`, `true` by default */
  respectReducedMotion?: boolean;
}

/**
 * Current time from the one shared `requestAnimationFrame` loop. The loop stops while the document
 * is hidden and, unless `respectReducedMotion` is off, under `prefers-reduced-motion`.
 */
export function useAnimationTime({
  intervalMs = 0,
  active = true,
  respectReducedMotion = true,
}: UseAnimationTimeOptions = {}): number {
  const reducedMotion = useReducedMotion();
  const running = active && !(respectReducedMotion && reducedMotion);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!running) {
      return;
    }
    setNow(Date.now());
    return subscribeToAnimationTime(setNow, intervalMs);
  }, [running, intervalMs]);

  return now;
}

/**
 * Negative `animation-delay` that puts a CSS animation of `durationSeconds` on the phase of the
 * shared clock, so indicators mounted at different moments sweep together.
 */
export function useAnimationPhaseDelay(durationSeconds: number): string | undefined {
  const reducedMotion = useReducedMotion();
  const offset = useMemo(() => {
    if (!(durationSeconds > 0)) {
      return 0;
    }
    return ((Date.now() - epoch) % (durationSeconds * 1000)) / 1000;
  }, [durationSeconds]);

  if (reducedMotion || offset === 0) {
    return undefined;
  }
  return `-${offset}s`;
}
