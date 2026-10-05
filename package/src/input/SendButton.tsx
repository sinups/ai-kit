import React from 'react';
import { Box } from '@mantine/core';
import { IconArrowUp, IconPlayerStopFilled } from '@tabler/icons-react';
import { cx } from '../utils/cx';
import classes from './SendButton.module.css';

export interface SendButtonProps {
  /** `idle` when there is nothing to send, `typing` when input is non-empty, `streaming` while a response is in flight */
  state: 'idle' | 'typing' | 'streaming';
  /** Keeps the filled look while idle, for a line where this is the only control */
  solid?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/** 28px round send / stop indicator rendered inside the composer toolbar */
export function SendButton({ state, solid = false, className, style }: SendButtonProps) {
  return (
    <Box
      className={cx(classes.root, className)}
      data-state={state}
      data-solid={solid || undefined}
      style={style}
    >
      {state === 'streaming' ? (
        <IconPlayerStopFilled size={16} className={classes.icon} />
      ) : (
        <IconArrowUp size={16} className={classes.icon} />
      )}
    </Box>
  );
}

SendButton.displayName = 'SendButton';
