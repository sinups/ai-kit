import { useEffect, useRef } from 'react';

/** Calls `onComplete` after `duration` ms while `isAnimating` is true */
export function useToolComplete(isAnimating: boolean, duration: number, onComplete: () => void) {
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!isAnimating) {
      return;
    }
    if (!Number.isFinite(duration) || duration >= Number.MAX_SAFE_INTEGER) {
      return;
    }
    const t = setTimeout(() => onCompleteRef.current(), duration);
    return () => clearTimeout(t);
  }, [isAnimating, duration]);
}
