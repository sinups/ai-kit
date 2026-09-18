import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useReducedMotion } from '@mantine/hooks';

export type AppearanceTracker = {
  /** Whether newly arrived items may animate at all */
  enabled: boolean;
  /** Whether the item behind `key` arrived after the first paint; the answer never changes for a key */
  isNew: (key: string) => boolean;
};

export const NO_APPEARANCE: AppearanceTracker = { enabled: false, isNew: () => false };

/**
 * Remembers which keys were already on screen with the first content, so only items that arrive
 * later animate: a transcript restored after mount shows at once. The verdict for a key is taken
 * once and kept, which keeps a running animation from restarting.
 */
export function useAppearanceTracker(enabled: boolean, hasContent = true): AppearanceTracker {
  const reducedMotion = useReducedMotion();
  const active = enabled && !reducedMotion;
  const verdicts = useRef(new Map<string, boolean>());
  const painted = useRef(false);

  useEffect(() => {
    if (hasContent) {
      painted.current = true;
    }
  }, [hasContent]);

  const isNew = useCallback(
    (key: string) => {
      const known = verdicts.current.get(key);
      if (known !== undefined) {
        return active && known;
      }
      verdicts.current.set(key, painted.current);
      return active && painted.current;
    },
    [active]
  );

  return useMemo(() => ({ enabled: active, isNew }), [active, isNew]);
}
