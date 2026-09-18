import React from 'react';
import type { ToolCallState } from '../tools/tool-call-state';
import { cx } from '../utils/cx';
import classes from './Rows.module.css';

export interface ToolCallRowProps {
  /** Tool name, shown in bold */
  name: string;
  /** Arguments, shown in brackets right after the name */
  args?: string;
  /** Visible state of the call, see `deriveToolCallState` */
  state: ToolCallState;
  /** Content after the arguments: chips, elapsed time, progress */
  trailingContent?: React.ReactNode;
  /** Rows under the call: its output, progress or refusal, usually `ResponseRow` */
  children?: React.ReactNode;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

/** One call of the transcript: marker, name, arguments and the rows that answer it */
export function ToolCallRow({
  name,
  args,
  state,
  trailingContent,
  children,
  className,
  style,
}: ToolCallRowProps) {
  return (
    <div className={cx(classes.call, className)} style={style} data-state={state}>
      <div className={classes.callLine}>
        <span className={classes.marker} data-state={state} aria-hidden />
        <span className={classes.callText}>
          <span className={classes.name}>{name}</span>
          {args ? <span className={classes.args}>({args})</span> : null}
          {trailingContent ? <span className={classes.trailing}>{trailingContent}</span> : null}
        </span>
      </div>
      {children}
    </div>
  );
}

ToolCallRow.displayName = 'ToolCallRow';
