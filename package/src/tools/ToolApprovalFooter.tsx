import React, { memo, useMemo, useState } from 'react';
import { Box, UnstyledButton } from '@mantine/core';
import { cx } from '../utils/cx';
import classes from './ToolApprovalFooter.module.css';

export type ToolApproval = {
  /** Approve button label, `Next` by default */
  approveLabel?: string;
  /** Reject button label, `Skip` by default */
  rejectLabel?: string;
  /** Called once when the approve button is clicked */
  onApprove?: () => void;
  /** Called once when the reject button is clicked */
  onReject?: () => void;
};

export interface ToolApprovalFooterProps extends ToolApproval {
  /** Shows the "Starting..." status while the tool is running */
  isPending?: boolean;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

/** Approve/reject footer rendered under tool cards that require confirmation */
export const ToolApprovalFooter = memo(function ToolApprovalFooter({
  isPending,
  approveLabel,
  rejectLabel,
  onApprove,
  onReject,
  className,
  style,
}: ToolApprovalFooterProps) {
  const [decision, setDecision] = useState<'approved' | 'rejected' | null>(null);

  const approveText = decision === 'approved' ? 'Approved' : (approveLabel ?? 'Next');
  const rejectText = decision === 'rejected' ? 'Skipped' : (rejectLabel ?? 'Skip');

  const handleApprove = () => {
    if (decision) {
      return;
    }
    setDecision('approved');
    onApprove?.();
  };

  const handleReject = () => {
    if (decision) {
      return;
    }
    setDecision('rejected');
    onReject?.();
  };

  const statusConfig = useMemo(() => {
    if (decision === 'approved') {
      return { label: 'Waiting', dots: true };
    }
    if (decision === 'rejected') {
      return { label: 'Canceled', dots: false };
    }
    if (isPending) {
      return { label: 'Starting', dots: true };
    }
    return null;
  }, [decision, isPending]);

  return (
    <Box className={cx(classes.root, className)} style={style}>
      {statusConfig ? (
        <span className={classes.status}>
          {statusConfig.label}
          {statusConfig.dots && (
            <span className={classes.dots} aria-hidden="true">
              <span className={classes.dot}>.</span>
              <span className={classes.dot}>.</span>
              <span className={classes.dot}>.</span>
            </span>
          )}
        </span>
      ) : (
        <span aria-hidden="true" />
      )}
      <div className={classes.actions}>
        <UnstyledButton
          className={cx(classes.button, classes.reject)}
          onClick={handleReject}
          disabled={Boolean(decision)}
        >
          {rejectText}
        </UnstyledButton>
        <UnstyledButton
          className={cx(classes.button, classes.approve)}
          onClick={handleApprove}
          disabled={Boolean(decision)}
        >
          {approveText}
        </UnstyledButton>
      </div>
    </Box>
  );
});
