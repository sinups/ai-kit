import React, { useState } from 'react';
import { Box, BoxProps, Collapse, ElementProps, UnstyledButton } from '@mantine/core';
import { IconChevronRight } from '@tabler/icons-react';
import { useMinDisplayTime } from '../hooks/use-min-display-time';
import { TextShimmer } from '../TextShimmer/TextShimmer';
import { cx } from '../utils/cx';
import classes from './ToolRowBase.module.css';

export interface ToolRowBaseProps extends BoxProps, ElementProps<'div', 'children'> {
  /** Icon rendered before the label, 12x12 box */
  icon?: React.ReactNode;
  /** Label shown with shimmer while `isAnimating` is true */
  shimmerLabel?: string;
  /** Label shown when the tool has completed */
  completeLabel: string;
  isAnimating: boolean;
  /** Muted, truncated text after the label */
  detail?: string;
  /** Lines the detail may wrap to before the ellipsis, `1` by default */
  detailLines?: number;
  /** Content rendered at the end of the row, for example elapsed time */
  trailingContent?: React.ReactNode;
  /** How long a status stays readable before the next one replaces it in ms, `600` by default, `0` disables */
  minStatusMs?: number;
  /** Whether the row can be expanded to reveal `children` */
  expandable?: boolean;
  /** Controlled expanded state */
  expanded?: boolean;
  /** Initial expanded state in uncontrolled mode */
  defaultOpen?: boolean;
  onToggleExpand?: () => void;
  children?: React.ReactNode;
}

/** Single-line tool status row with optional collapsible body. Base for most tool cards. */
export function ToolRowBase({
  icon,
  shimmerLabel,
  completeLabel,
  isAnimating,
  detail,
  detailLines = 1,
  trailingContent,
  minStatusMs,
  expandable = false,
  expanded,
  defaultOpen = false,
  onToggleExpand,
  children,
  className,
  ...others
}: ToolRowBaseProps) {
  const status = useMinDisplayTime(
    { isAnimating, shimmerLabel, completeLabel },
    { minMs: minStatusMs, key: `${isAnimating}\u0000${shimmerLabel ?? ''}\u0000${completeLabel}` }
  );
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isControlled = expanded !== undefined;
  const isOpen = isControlled ? expanded : internalOpen;

  const handleToggle = () => {
    if (isControlled) {
      onToggleExpand?.();
    } else {
      setInternalOpen((prev) => !prev);
      onToggleExpand?.();
    }
  };

  const row = (
    <div className={classes.row} data-toggle={expandable || undefined}>
      <div className={classes.content} data-wrap={detailLines > 1 || undefined}>
        {icon && <span className={classes.icon}>{icon}</span>}
        <span className={classes.label}>
          {status.isAnimating && status.shimmerLabel ? (
            <TextShimmer duration={1.2} className={classes.shimmer}>
              {status.shimmerLabel}
            </TextShimmer>
          ) : (
            status.completeLabel
          )}
        </span>
        {detail && (
          <span
            className={classes.detail}
            data-lines={detailLines > 1 ? detailLines : undefined}
            style={
              detailLines > 1
                ? ({ '--ae-detail-lines': detailLines } as React.CSSProperties)
                : undefined
            }
          >
            {detail}
          </span>
        )}
        {trailingContent}
      </div>
      {expandable && (
        <span className={classes.chevron} data-open={isOpen || undefined}>
          <IconChevronRight size={12} />
        </span>
      )}
    </div>
  );

  if (!expandable) {
    return (
      <Box className={cx(classes.root, className)} {...others}>
        {row}
      </Box>
    );
  }

  return (
    <Box className={cx(classes.root, className)} data-expandable {...others}>
      <UnstyledButton className={classes.trigger} onClick={handleToggle} aria-expanded={isOpen}>
        {row}
      </UnstyledButton>
      <Collapse expanded={isOpen} transitionDuration={150} transitionTimingFunction="ease-out">
        {children}
      </Collapse>
    </Box>
  );
}

ToolRowBase.displayName = 'ToolRowBase';
