import React from 'react';
import { Box, BoxProps, ElementProps } from '@mantine/core';
import { useReducedMotion } from '@mantine/hooks';
import { useAnimationPhaseDelay } from '../hooks/use-animation-clock';
import { cx } from '../utils/cx';
import classes from './TextShimmer.module.css';

export interface TextShimmerProps extends BoxProps, ElementProps<'span', 'children'> {
  children: React.ReactNode;
  /** Element to render, `'span'` by default */
  as?: React.ElementType;
  /** Duration of one shimmer sweep in seconds, `2` by default */
  duration?: number;
  /** Delay before the animation starts in seconds, `0` by default */
  delay?: number;
  /** Width of the highlight in px exposed as `--ae-shimmer-spread`, `100` by default */
  spread?: number;
}

/** Text with a subtle moving highlight, used for in-progress labels */
export const TextShimmer = React.memo(function TextShimmer({
  children,
  as = 'span',
  className,
  duration = 2,
  delay = 0,
  spread = 100,
  style,
  ...others
}: TextShimmerProps) {
  const reducedMotion = useReducedMotion();
  const phaseDelay = useAnimationPhaseDelay(duration);

  return (
    <Box
      component={as as any}
      className={cx(classes.root, className)}
      data-static={reducedMotion || undefined}
      style={{
        '--ae-shimmer-duration': `${duration}s`,
        '--ae-shimmer-spread': `${spread}px`,
        animationDelay: delay > 0 ? `${delay}s` : phaseDelay,
        ...style,
      }}
      {...others}
    >
      {children}
    </Box>
  );
});

TextShimmer.displayName = 'TextShimmer';
