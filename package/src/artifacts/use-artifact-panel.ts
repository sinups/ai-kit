import { useCallback, useEffect, useRef, useState } from 'react';
import type { ArtifactRef } from './types';

export type UseArtifactPanelReturn = {
  /** Artifact on screen, `null` while the panel is closed */
  current: ArtifactRef | null;
  /** Opens the panel with this artifact and remembers the element outside the panel that had the focus */
  open: (artifact: ArtifactRef) => void;
  /** Closes the panel and gives the focus back, unless something else already took it */
  close: () => void;
  /** Spread into `ChatInspectorLayout`: `opened` and `onOpenedChange` */
  layoutProps: { opened: boolean; onOpenedChange: (opened: boolean) => void };
};

function isFocusLost(): boolean {
  const active = document.activeElement;
  return !active || active === document.body || !active.isConnected;
}

/**
 * State of `ArtifactPanel` inside `ChatInspectorLayout`. The hook owns the way back: on close the
 * focus returns to the card or link that opened the panel, only if the closing left it nowhere, so
 * a drawer that already restored it is not overridden.
 */
export function useArtifactPanel(): UseArtifactPanelReturn {
  const [current, setCurrent] = useState<ArtifactRef | null>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const frame = useRef(0);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  const open = useCallback((artifact: ArtifactRef) => {
    const active = document.activeElement;
    if (
      active instanceof HTMLElement &&
      active !== document.body &&
      !active.closest('[data-artifact-panel]')
    ) {
      returnFocus.current = active;
    }
    setCurrent(artifact);
  }, []);

  const close = useCallback(() => {
    setCurrent(null);
    const target = returnFocus.current;
    returnFocus.current = null;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      if (target?.isConnected && isFocusLost()) {
        target.focus();
      }
    });
  }, []);

  const onOpenedChange = useCallback(
    (opened: boolean) => {
      if (!opened) {
        close();
      }
    },
    [close]
  );

  return { current, open, close, layoutProps: { opened: current !== null, onOpenedChange } };
}
