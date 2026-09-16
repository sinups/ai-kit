import React, { useState } from 'react';
import { Box, BoxProps, Collapse, ElementProps, UnstyledButton } from '@mantine/core';
import { IconChevronRight } from '@tabler/icons-react';
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
  /** Content rendered at the end of the row, for example elapsed time */
  trailingContent?: React.ReactNode;
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
  trailingContent,
  expandable = false,
  expanded,
  defaultOpen = false,
  onToggleExpand,
  children,
  className,
  ...others
}: ToolRowBaseProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isControlled = expanded !== undefined;
  const isOpen = isControlled ? expanded : internalOpen;
  const isComplete = !isAnimating;
  const canToggle = expandable && (isComplete || isOpen || isAnimating);

  const handleToggle = () => {
    if (!canToggle) {
      return;
    }
    if (isControlled) {
      onToggleExpand?.();
    } else {
      setInternalOpen((prev) => !prev);
      onToggleExpand?.();
    }
  };

  const row = (
    <div className={classes.row} data-toggle={canToggle || undefined}>
      <div className={classes.content}>
        {icon && <span className={classes.icon}>{icon}</span>}
        <span className={classes.label}>
          {isAnimating && shimmerLabel ? (
            <TextShimmer duration={1.2} className={classes.shimmer}>
              {shimmerLabel}
            </TextShimmer>
          ) : (
            completeLabel
          )}
        </span>
        {detail && <span className={classes.detail}>{detail}</span>}
        {trailingContent}
      </div>
      {canToggle && (
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
      <UnstyledButton
        className={classes.trigger}
        onClick={handleToggle}
        disabled={!canToggle}
        aria-expanded={isOpen}
      >
        {row}
      </UnstyledButton>
      <Collapse expanded={isOpen} transitionDuration={150} transitionTimingFunction="ease-out">
        {children}
      </Collapse>
    </Box>
  );
}

ToolRowBase.displayName = 'ToolRowBase';
