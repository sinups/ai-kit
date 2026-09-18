import React, { createContext, useContext } from 'react';
import { cx } from '../utils/cx';
import classes from './Rows.module.css';

const NestedResponseContext = createContext(false);

export type ResponseRowTone = 'default' | 'muted' | 'error';

export interface ResponseRowProps {
  /** Reply to the row above: the output of a call, a refusal, a progress line */
  children: React.ReactNode;
  /** `muted` for status lines, `error` for a failure */
  tone?: ResponseRowTone;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

/**
 * Answer to the row above it, under the `⎿` gutter. A response inside another response drops the
 * gutter instead of drawing a second one, so nested output keeps one left edge.
 */
export function ResponseRow({ children, tone = 'default', className, style }: ResponseRowProps) {
  const nested = useContext(NestedResponseContext);

  if (nested) {
    return (
      <div className={cx(classes.responseBody, className)} data-tone={tone} style={style}>
        {children}
      </div>
    );
  }

  return (
    <NestedResponseContext.Provider value>
      <div className={cx(classes.response, className)} style={style}>
        <span className={classes.gutter} aria-hidden>
          ⎿
        </span>
        <div className={classes.responseBody} data-tone={tone}>
          {children}
        </div>
      </div>
    </NestedResponseContext.Provider>
  );
}

ResponseRow.displayName = 'ResponseRow';
