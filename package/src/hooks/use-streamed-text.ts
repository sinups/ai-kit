import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '@mantine/hooks';

export interface UseStreamedTextOptions {
  /** More text is still arriving, `true` by default; `false` commits the buffer right away */
  streaming?: boolean;
  /** Typing is off while `false`, which returns `text` unchanged */
  enabled?: boolean;
  /** Even pace of the typing, characters per second; `140` by default */
  charsPerSecond?: number;
  /** The buffer never lags behind the stream by longer than this, `350` ms by default */
  catchUpMs?: number;
}

const DEFAULT_CHARS_PER_SECOND = 140;
const DEFAULT_CATCH_UP_MS = 350;
/** A token this long with no space in it is typed through, so a long url never holds the line */
const LONGEST_HELD_WORD = 160;
const LONGEST_FRAME_MS = 100;
/** The stream went quiet mid-word: after this the held tail is typed out rather than kept waiting */
const IDLE_RELEASE_MS = 400;

function isHidden(): boolean {
  return typeof document !== 'undefined' && document.visibilityState === 'hidden';
}

function canSchedule(): boolean {
  return typeof requestAnimationFrame === 'function';
}

function isSpace(char: string): boolean {
  return char === ' ' || char === '\n' || char === '\t' || char === '\r';
}

/**
 * End of the bite: the last word boundary up to `target`, so the tail of the buffer never breaks a
 * word or a markdown marker in half. Without a boundary the word is held until it grows past
 * `LONGEST_HELD_WORD`.
 */
function cutAt(text: string, from: number, target: number): number {
  if (target <= from) {
    return from;
  }
  let index = target;
  while (index > from && !isSpace(text[index - 1])) {
    index -= 1;
  }
  if (index > from) {
    return index;
  }
  return target - from >= LONGEST_HELD_WORD ? target : from;
}

/**
 * Types streamed text at an even pace instead of repeating the bursts of the provider: the text that
 * arrived waits in a buffer and is released by whole words, once per animation frame, at
 * `charsPerSecond` — faster while the buffer is full, so the answer on screen is never older than
 * `catchUpMs`. Commits the rest at once when the stream ends, while the document is hidden and under
 * `prefers-reduced-motion`, where frames may never arrive.
 */
export function useStreamedText(text: string, options: UseStreamedTextOptions = {}): string {
  const {
    streaming = true,
    enabled = true,
    charsPerSecond = DEFAULT_CHARS_PER_SECOND,
    catchUpMs = DEFAULT_CATCH_UP_MS,
  } = options;
  const reducedMotion = useReducedMotion();
  const [, countFrame] = useState(0);
  const latest = useRef(text);
  const shown = useRef(text);
  const frame = useRef<number | null>(null);
  const previousFrameAt = useRef<number | null>(null);
  const owed = useRef(0);
  const grewAt = useRef(0);
  const lastLength = useRef(text.length);
  const speed = useRef({ charsPerSecond, catchUpMs });
  speed.current = { charsPerSecond, catchUpMs };

  latest.current = text;
  const typing = enabled && streaming && !reducedMotion && !isHidden() && canSchedule();
  if (!typing || !text.startsWith(shown.current)) {
    shown.current = text;
  }

  const engine = useRef<{ schedule: () => void; stop: () => void; flush: () => void }>(null);
  if (engine.current === null) {
    const stop = () => {
      if (frame.current !== null) {
        cancelAnimationFrame(frame.current);
        frame.current = null;
      }
      previousFrameAt.current = null;
      owed.current = 0;
    };
    const release = (elapsedMs: number, now: number) => {
      const pending = latest.current.length - shown.current.length;
      if (pending <= 0) {
        return false;
      }
      const { charsPerSecond: pace, catchUpMs: catchUp } = speed.current;
      const perSecond = Math.max(pace, catchUp > 0 ? (pending * 1000) / catchUp : pending);
      owed.current = Math.min(owed.current + (perSecond * elapsedMs) / 1000, pending);
      const from = shown.current.length;
      const step = Math.floor(owed.current);
      if (step < 1) {
        return false;
      }
      const target = Math.min(latest.current.length, from + step);
      let cut = cutAt(latest.current, from, target);
      if (cut === from) {
        if (target < latest.current.length || now - grewAt.current < IDLE_RELEASE_MS) {
          return false;
        }
        cut = target;
      }
      owed.current -= cut - from;
      shown.current = latest.current.slice(0, cut);
      return true;
    };
    const tick = (now: number) => {
      frame.current = null;
      const elapsed =
        previousFrameAt.current === null
          ? 16
          : Math.min(now - previousFrameAt.current, LONGEST_FRAME_MS);
      previousFrameAt.current = now;
      if (latest.current.length !== lastLength.current) {
        lastLength.current = latest.current.length;
        grewAt.current = now;
      }
      const moved = release(elapsed, now);
      if (latest.current.length > shown.current.length) {
        schedule();
      } else {
        previousFrameAt.current = null;
      }
      if (moved) {
        countFrame((count) => count + 1);
      }
    };
    const schedule = () => {
      if (frame.current === null) {
        frame.current = requestAnimationFrame(tick);
      }
    };
    engine.current = {
      schedule,
      stop,
      flush: () => {
        stop();
        if (shown.current !== latest.current) {
          shown.current = latest.current;
          countFrame((count) => count + 1);
        }
      },
    };
  }

  useEffect(() => {
    if (!typing) {
      engine.current?.stop();
      return;
    }
    if (latest.current.length > shown.current.length) {
      engine.current?.schedule();
    }
  });

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }
    const onVisibilityChange = () => {
      if (isHidden()) {
        engine.current?.flush();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, []);

  useEffect(() => () => engine.current?.stop(), []);

  return shown.current;
}
