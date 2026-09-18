import React, { useCallback, useRef, useState } from 'react';
import { Box, BoxProps, ElementProps } from '@mantine/core';
import { useReducedMotion } from '@mantine/hooks';
import { useAnimationPhaseDelay } from '../hooks/use-animation-clock';
import { cx } from '../utils/cx';
import classes from './SpiralLoader.module.css';

const FAST_REPEATS = 4;
const SLOW_REPEATS = 2;
const FAST_DURATION = 0.5;
const SLOW_DURATION = 1;

export interface SpiralLoaderProps extends BoxProps, ElementProps<'div'> {
  /** Width and height in px, `16` by default */
  size?: number;
}

const SPIRAL_PATH =
  'M-12 6C-7.548 6 -5.264 2.284 -4.975 -1.012C-4.745 -3.639 -5.782 -6 -8 -6C-10.218 -6 -11.255 -3.639 -11.025 -1.012C-10.736 2.284 -8.452 6 -4 6C0.452 6 2.736 2.284 3.025 -1.012C3.255 -3.639 2.218 -6 0 -6C-2.218 -6 -3.255 -3.639 -3.025 -1.012C-2.736 2.284 -0.452 6 4 6C8.452 6 10.736 2.284 11.025 -1.012C11.255 -3.639 10.218 -6 8 -6C5.782 -6 4.748 -3.639 4.98 -1.012C5.272 2.284 7.557 6 12 6';

/**
 * Animated squiggle shown while the assistant is processing.
 * Alternates between a fast phase and a slow phase like the original Lottie animation.
 */
export function SpiralLoader({ size = 16, className, style, ...others }: SpiralLoaderProps) {
  const [phase, setPhase] = useState<'fast' | 'slow'>('fast');
  const repeatCountRef = useRef(0);
  const reducedMotion = useReducedMotion();
  const duration = phase === 'fast' ? FAST_DURATION : SLOW_DURATION;
  const phaseDelay = useAnimationPhaseDelay(duration);

  const handleIteration = useCallback(
    (event: React.AnimationEvent<SVGGElement>) => {
      if (event.target !== event.currentTarget) {
        return;
      }
      repeatCountRef.current += 1;
      const limit = phase === 'fast' ? FAST_REPEATS : SLOW_REPEATS;
      if (repeatCountRef.current >= limit) {
        repeatCountRef.current = 0;
        setPhase((prev) => (prev === 'fast' ? 'slow' : 'fast'));
      }
    },
    [phase]
  );

  return (
    <Box
      className={cx(classes.root, className)}
      data-static={reducedMotion || undefined}
      style={{
        width: size,
        height: size,
        '--ae-spiral-duration': `${duration}s`,
        '--ae-spiral-delay': phaseDelay,
        ...style,
      }}
      {...others}
    >
      <svg viewBox="0 0 16 16" className={classes.svg} aria-hidden>
        <g className={classes.group} onAnimationIteration={handleIteration}>
          <g transform="translate(8 8)">
            <path d={SPIRAL_PATH} pathLength={100} className={classes.path} />
          </g>
        </g>
      </svg>
    </Box>
  );
}

SpiralLoader.displayName = 'SpiralLoader';
