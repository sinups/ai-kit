import { useEffect, useState } from 'react';

function toTimestamp(target: number | Date | undefined): number | undefined {
  if (target === undefined) {
    return undefined;
  }
  return target instanceof Date ? target.getTime() : target;
}

/** Seconds left until `target`, updated every second; `undefined` when there is no target */
export function useCountdown(target: number | Date | undefined): number | undefined {
  const timestamp = toTimestamp(target);
  const compute = () =>
    timestamp === undefined ? undefined : Math.max(0, Math.ceil((timestamp - Date.now()) / 1000));
  const [secondsLeft, setSecondsLeft] = useState(compute);

  useEffect(() => {
    setSecondsLeft(compute());
    if (timestamp === undefined) {
      return;
    }
    const interval = setInterval(() => {
      const next = compute();
      setSecondsLeft(next);
      if (next === 0) {
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [timestamp]);

  return secondsLeft;
}
