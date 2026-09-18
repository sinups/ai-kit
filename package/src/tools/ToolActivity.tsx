import React from 'react';
import { Progress } from '@mantine/core';
import type { ToolCallProgress } from '../types';
import { cx } from '../utils/cx';
import { formatToolProgress, getToolProgressRatio } from './tool-progress';
import classes from './ToolActivity.module.css';

export interface ToolActivityProps {
  /** Formatted elapsed time of the running call, see `useElapsed` */
  elapsed?: string;
  /** Latest progress notification of the call, see `getToolProgress` */
  progress?: ToolCallProgress;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

/** Trailing slot of a tool row: progress of the call and how long it has been running */
export function ToolActivity({ elapsed, progress, className, style }: ToolActivityProps) {
  const ratio = progress ? getToolProgressRatio(progress) : undefined;
  if (!elapsed && !progress) {
    return null;
  }

  return (
    <span className={cx(classes.root, className)} style={style}>
      {progress && (
        <>
          {ratio !== undefined && (
            <Progress
              value={ratio * 100}
              size="xs"
              radius="xl"
              className={classes.bar}
              aria-hidden
            />
          )}
          <span data-tool-progress>{formatToolProgress(progress)}</span>
          {progress.message && <span className={classes.message}>{progress.message}</span>}
        </>
      )}
      {elapsed && <span data-tool-elapsed>{elapsed}</span>}
    </span>
  );
}

ToolActivity.displayName = 'ToolActivity';
