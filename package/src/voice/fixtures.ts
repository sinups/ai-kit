import { useEffect, useState } from 'react';

/** Levels that rise and fall like speech, for stories only */
export function useWobble(active: boolean, bars = 1): number[] {
  const [levels, setLevels] = useState<number[]>(() => Array(bars).fill(0));
  useEffect(() => {
    if (!active) {
      return undefined;
    }
    let tick = 0;
    const timer = setInterval(() => {
      tick += 1;
      setLevels(
        Array.from({ length: bars }, (_, index) => 0.5 + 0.45 * Math.sin(tick / 2 + index * 1.3))
      );
    }, 120);
    return () => clearInterval(timer);
  }, [active, bars]);
  return active ? levels : Array(bars).fill(0);
}
