import { useEffect, useRef, useState } from 'react';

const TICK_MS = 16;

/** Simulates a user typing `text` into the composer over `duration` ms */
export function useInputTyping(
  text: string,
  duration: number,
  isActive: boolean,
  onComplete: () => void
) {
  const [visibleChars, setVisibleChars] = useState(0);
  const [showImage, setShowImage] = useState(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!isActive) {
      setVisibleChars(0);
      setShowImage(false);
      return;
    }

    const imageDelay = duration * 0.1;
    const typingStart = duration * 0.15;
    const typingDuration = duration * 0.7;
    const charInterval = text.length > 0 ? typingDuration / text.length : typingDuration;
    const sendDelay = duration * 0.15;
    const completeAt = typingStart + typingDuration + sendDelay;
    const startedAt = Date.now();

    const tick = () => {
      const elapsed = Date.now() - startedAt;
      if (elapsed >= imageDelay) {
        setShowImage(true);
      }
      if (elapsed >= typingStart && text.length > 0) {
        const typed = Math.floor((elapsed - typingStart) / charInterval) + 1;
        setVisibleChars(Math.min(typed, text.length));
      }
      if (elapsed >= completeAt) {
        clearInterval(interval);
        onCompleteRef.current();
      }
    };

    const interval = setInterval(tick, TICK_MS);
    return () => clearInterval(interval);
  }, [isActive, text, duration]);

  return { displayedText: text.slice(0, visibleChars), showImage };
}
