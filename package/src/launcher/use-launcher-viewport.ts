import { useEffect, useState } from 'react';
import { useIsomorphicEffect } from '@mantine/hooks';

export interface LauncherViewport {
  width: number;
  height: number;
}

function getWindowViewport(): LauncherViewport {
  return typeof window === 'undefined'
    ? { width: 1024, height: 768 }
    : { width: window.innerWidth, height: window.innerHeight };
}

/** Size of the box a fixed element is laid out against: the window, or a transformed ancestor when the launcher is rendered without a portal */
export function useLauncherViewport(probe: HTMLElement | null): LauncherViewport {
  const [viewport, setViewport] = useState(getWindowViewport);

  useIsomorphicEffect(() => {
    if (!probe) {
      return undefined;
    }
    const measure = () => {
      const rect = probe.getBoundingClientRect();
      const next =
        rect.width > 0 && rect.height > 0
          ? { width: Math.round(rect.width), height: Math.round(rect.height) }
          : getWindowViewport();
      setViewport((current) =>
        current.width === next.width && current.height === next.height ? current : next
      );
    };
    measure();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    observer?.observe(probe);
    const view = probe.ownerDocument.defaultView;
    view?.addEventListener('resize', measure);
    return () => {
      observer?.disconnect();
      view?.removeEventListener('resize', measure);
    };
  }, [probe]);

  return viewport;
}

/** Stops the page behind a full screen panel from scrolling */
export function useFrozenPageScroll(node: HTMLElement | null, locked: boolean) {
  useEffect(() => {
    if (!node || !locked) {
      return undefined;
    }
    const root = node.ownerDocument.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = 'hidden';
    return () => {
      root.style.overflow = previous;
    };
  }, [node, locked]);
}
