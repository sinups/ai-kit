import { useEffect, type RefObject } from 'react';

// Mantine traps focus in a Drawer or Modal after its open transition, and a remount during it drops the focus.
const OVERLAY_TRANSITION_MS = 300;

/** Focuses the `data-autofocus` element of `ref` when it sits in a dialog that does not hold the focus yet */
export function useOverlayAutofocus(ref: RefObject<HTMLElement | null>, enabled: boolean) {
  useEffect(() => {
    if (!enabled) {
      return;
    }
    const focus = () => {
      const root = ref.current;
      const dialog = root?.closest('[role="dialog"]');
      const active = document.activeElement;
      if (dialog && (!active || active === document.body || !dialog.contains(active))) {
        const target = root?.matches('[data-autofocus]')
          ? root
          : root?.querySelector<HTMLElement>('[data-autofocus]');
        target?.focus({ preventScroll: true });
      }
    };
    focus();
    const id = window.setTimeout(focus, OVERLAY_TRANSITION_MS);
    return () => window.clearTimeout(id);
  }, [ref, enabled]);
}
