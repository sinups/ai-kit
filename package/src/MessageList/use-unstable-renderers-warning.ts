import { useEffect, useRef } from 'react';

let warned = false;

/** Warns once in development when `partRenderers` is a new object on three renders in a row */
export function useUnstableRenderersWarning(renderers: object | undefined): void {
  const track = useRef({ value: renderers, changes: 0 });
  useEffect(() => {
    if (warned || typeof process === 'undefined' || process.env.NODE_ENV === 'production') {
      return;
    }
    const current = track.current;
    current.changes =
      renderers && current.value && renderers !== current.value ? current.changes + 1 : 0;
    current.value = renderers;
    if (current.changes >= 3) {
      warned = true;
      // eslint-disable-next-line no-console
      console.warn(
        '[ai-kit] `partRenderers` is a new object on every render, so finished messages re-render on every token. Create it once, outside the component or with `useMemo`.'
      );
    }
  });
}
