import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '@mantine/hooks';

export interface UseStreamedTextOptions {
  /** More text is still arriving, `true` by default; `false` commits the buffer right away */
  streaming?: boolean;
  /** Batching is off while `false`, which returns `text` unchanged */
  enabled?: boolean;
}

function isHidden(): boolean {
  return typeof document !== 'undefined' && document.visibilityState === 'hidden';
}

function canSchedule(): boolean {
  return typeof requestAnimationFrame === 'function';
}

/**
 * Buffers streamed text and commits it at most once per animation frame, so a caller that re-renders
 * per token still lays out once per frame. Commits synchronously when the stream ends, while the
 * document is hidden and under `prefers-reduced-motion`, where frames may never arrive.
 */
export function useStreamedText(text: string, options: UseStreamedTextOptions = {}): string {
  const { streaming = true, enabled = true } = options;
  const reducedMotion = useReducedMotion();
  const [, countFrame] = useState(0);
  const latest = useRef(text);
  const shown = useRef(text);
  const frame = useRef<number | null>(null);

  latest.current = text;
  const batching = enabled && streaming && !reducedMotion && !isHidden() && canSchedule();
  if (!batching) {
    shown.current = text;
  }

  const flush = useRef(() => {});
  flush.current = () => {
    if (frame.current !== null) {
      cancelAnimationFrame(frame.current);
      frame.current = null;
    }
    if (shown.current !== latest.current) {
      shown.current = latest.current;
      countFrame((count) => count + 1);
    }
  };

  useEffect(() => {
    if (!batching) {
      if (frame.current !== null) {
        cancelAnimationFrame(frame.current);
        frame.current = null;
      }
      return;
    }
    if (frame.current !== null || shown.current === latest.current) {
      return;
    }
    frame.current = requestAnimationFrame(() => {
      frame.current = null;
      shown.current = latest.current;
      countFrame((count) => count + 1);
    });
  });

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }
    const onVisibilityChange = () => {
      if (isHidden()) {
        flush.current();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, []);

  useEffect(
    () => () => {
      if (frame.current !== null) {
        cancelAnimationFrame(frame.current);
        frame.current = null;
      }
    },
    []
  );

  return shown.current;
}
