import React, { memo } from 'react';
import { Box } from '@mantine/core';
import { cx } from '../../utils/cx';
import classes from './VoiceLevel.module.css';

export interface VoiceLevelProps {
  /** Level from 0 to 1 per bar, three to five bars read best; one number draws three bars around it */
  levels: number[] | number;
  /** `user` for the microphone, `assistant` for speech the app plays, `user` by default */
  source?: 'user' | 'assistant';
  /** Flattens the bars when `false`, `true` by default */
  active?: boolean;
  /** Height of the bars, `sm` by default */
  size?: 'xs' | 'sm';
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

function clamp(value: number): number {
  return Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
}

function toBars(levels: number[] | number): number[] {
  if (Array.isArray(levels)) {
    return levels.map(clamp);
  }
  const level = clamp(levels);
  return [level * 0.6, level, level * 0.6];
}

/** Bars that follow a sound level from props; decorative, the owner announces the state */
export const VoiceLevel = memo(function VoiceLevel({
  levels,
  source = 'user',
  active = true,
  size = 'sm',
  className,
  style,
}: VoiceLevelProps) {
  const bars = toBars(levels);
  return (
    <Box
      className={cx(classes.root, className)}
      style={style}
      data-source={source}
      data-size={size}
      data-active={active || undefined}
      aria-hidden
    >
      {bars.map((level, index) => (
        <span
          key={index}
          className={classes.bar}
          style={{ '--bar-level': active ? level : 0 } as React.CSSProperties}
        />
      ))}
    </Box>
  );
});

VoiceLevel.displayName = 'VoiceLevel';
