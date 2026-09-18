import React from 'react';
import { Box, Text } from '@mantine/core';
import { cx } from '../utils/cx';
import { DEFAULT_TOOL_APPROVAL_LABELS, ToolApprovalFooter } from '../tools/ToolApprovalFooter';
import classes from './ToolApprovals.module.css';
import { useToolApproval, type ToolApprovalRequest } from './approval-context';

export {
  ToolApprovalsProvider,
  useToolApproval,
  useToolApprovals,
  type ToolApprovalDecision,
  type ToolApprovalOutcome,
  type ToolApprovalRequest,
  type ToolApprovals,
  type ToolApprovalsProviderProps,
} from './approval-context';

export interface ToolApprovalOutcomeLabels {
  /** Outcome of an approved call, `Approved` by default */
  approved: string;
  /** Outcome of a call the user refused, `Skipped` by default */
  outcomeRejected: string;
}

export const DEFAULT_TOOL_APPROVAL_OUTCOME_LABELS: ToolApprovalOutcomeLabels = {
  approved: DEFAULT_TOOL_APPROVAL_LABELS.approved,
  outcomeRejected: DEFAULT_TOOL_APPROVAL_LABELS.skipped,
};

/**
 * Text of a settled request: `outcome.label`, otherwise `labels.approved` or `labels.skipped` of
 * the request, then of `fallback`, then the English default, followed by the scope.
 */
export function getToolApprovalOutcomeText(
  request: ToolApprovalRequest,
  fallback?: Partial<ToolApprovalOutcomeLabels>
): React.ReactNode {
  const outcome = request.outcome;
  if (!outcome) {
    return null;
  }
  if (outcome.label !== undefined) {
    return outcome.label;
  }
  const base =
    outcome.decision === 'approved'
      ? (request.labels?.approved ??
        fallback?.approved ??
        DEFAULT_TOOL_APPROVAL_OUTCOME_LABELS.approved)
      : (request.labels?.skipped ??
        fallback?.outcomeRejected ??
        DEFAULT_TOOL_APPROVAL_OUTCOME_LABELS.outcomeRejected);
  if (!outcome.scope) {
    return base;
  }
  const scope =
    request.labels?.scopes?.[outcome.scope] ??
    request.approveOptions?.find((option) => option.value === outcome.scope)?.label ??
    outcome.scope;
  return `${base} · ${scope}`;
}

export interface ToolApprovalSlotProps {
  /** Id of the call the approval is attached to */
  toolCallId?: string;
  /** The tool card this approval belongs to */
  children: React.ReactNode;
  /** Outcome labels used when the request has no `labels.approved` or `labels.skipped` of its own */
  labels?: Partial<ToolApprovalOutcomeLabels>;
  /** Draws one frame around the call and its approval, for calls that render as a bare row */
  framed?: boolean;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

/**
 * Renders a tool card and, under it, the approval the host attached to that call: the
 * approve/reject footer while the request is open, a quiet line once it is settled. Without a
 * request for this id the card is returned untouched.
 */
export function ToolApprovalSlot({
  toolCallId,
  children,
  labels,
  framed = false,
  className,
  style,
}: ToolApprovalSlotProps) {
  const approval = useToolApproval(toolCallId);
  if (!approval) {
    return <>{children}</>;
  }

  const { isPending, outcome, ...footer } = approval;

  return (
    <Box className={cx(classes.slot, className)} style={style} data-framed={framed || undefined}>
      {children}
      {outcome ? (
        <Text
          component="p"
          className={classes.outcome}
          data-decision={outcome.decision}
          data-testid="tool-approval-outcome"
        >
          {getToolApprovalOutcomeText(approval, labels)}
        </Text>
      ) : (
        <ToolApprovalFooter {...footer} isPending={isPending} className={classes.footer} />
      )}
    </Box>
  );
}

ToolApprovalSlot.displayName = 'ToolApprovalSlot';
