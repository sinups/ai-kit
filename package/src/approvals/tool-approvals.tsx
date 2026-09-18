import React, { createContext, memo, useContext } from 'react';
import { Box, Text } from '@mantine/core';
import { cx } from '../utils/cx';
import {
  DEFAULT_TOOL_APPROVAL_LABELS,
  ToolApprovalFooter,
  type ToolApproval,
} from '../tools/ToolApprovalFooter';
import classes from './ToolApprovals.module.css';

export type ToolApprovalDecision = 'approved' | 'rejected';

export type ToolApprovalOutcome = {
  /** How the request was settled */
  decision: ToolApprovalDecision;
  /** Scope the call was approved with, for example `session`, appended to the outcome text */
  scope?: string;
  /** Replaces the default outcome text */
  label?: React.ReactNode;
};

/** One approval request attached to a tool call by its `toolCallId` */
export type ToolApprovalRequest = ToolApproval & {
  /** The tool call has not finished yet; the footer shows "Starting..." after approval */
  isPending?: boolean;
  /** Set once the host settled the request; the footer is replaced by a quiet outcome line */
  outcome?: ToolApprovalOutcome;
};

/** Approval requests keyed by `toolCallId`; ids without a call in the transcript are ignored */
export type ToolApprovals = Record<string, ToolApprovalRequest | undefined>;

export interface ToolApprovalOutcomeLabels {
  /** Outcome of an approved call, `Approved` by default */
  approved: string;
  /** Outcome of a rejected call, `Skipped` by default */
  rejected: string;
}

export const DEFAULT_TOOL_APPROVAL_OUTCOME_LABELS: ToolApprovalOutcomeLabels = {
  approved: DEFAULT_TOOL_APPROVAL_LABELS.approved,
  rejected: DEFAULT_TOOL_APPROVAL_LABELS.skipped,
};

const ToolApprovalsContext = createContext<ToolApprovals | undefined>(undefined);

export interface ToolApprovalsProviderProps {
  /** Approval requests keyed by `toolCallId` */
  approvals?: ToolApprovals;
  children: React.ReactNode;
}

/** Makes host approval requests available to every tool call rendered inside it */
export function ToolApprovalsProvider({ approvals, children }: ToolApprovalsProviderProps) {
  return (
    <ToolApprovalsContext.Provider value={approvals}>{children}</ToolApprovalsContext.Provider>
  );
}

ToolApprovalsProvider.displayName = 'ToolApprovalsProvider';

/** Approval request attached to this call, `undefined` when the host has none for it */
export function useToolApproval(toolCallId?: string): ToolApprovalRequest | undefined {
  const approvals = useContext(ToolApprovalsContext);
  if (!approvals || !toolCallId) {
    return undefined;
  }
  return approvals[toolCallId];
}

export interface ToolApprovalSlotProps {
  /** Id of the call the approval is attached to */
  toolCallId?: string;
  /** The tool card this approval belongs to */
  children: React.ReactNode;
  /** Overrides of the default English outcome labels */
  labels?: Partial<ToolApprovalOutcomeLabels>;
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
export const ToolApprovalSlot = memo(function ToolApprovalSlot({
  toolCallId,
  children,
  labels: labelsProp,
  className,
  style,
}: ToolApprovalSlotProps) {
  const approval = useToolApproval(toolCallId);
  if (!approval) {
    return <>{children}</>;
  }

  const labels = { ...DEFAULT_TOOL_APPROVAL_OUTCOME_LABELS, ...labelsProp };
  const { isPending, outcome, ...footer } = approval;

  return (
    <Box className={cx(classes.slot, className)} style={style}>
      {children}
      {outcome ? (
        <Text
          component="p"
          className={classes.outcome}
          data-decision={outcome.decision}
          data-testid="tool-approval-outcome"
        >
          {outcome.label ?? formatOutcome(outcome, labels)}
        </Text>
      ) : (
        <ToolApprovalFooter {...footer} isPending={isPending} className={classes.footer} />
      )}
    </Box>
  );
});

ToolApprovalSlot.displayName = 'ToolApprovalSlot';

function formatOutcome(outcome: ToolApprovalOutcome, labels: ToolApprovalOutcomeLabels): string {
  const base = outcome.decision === 'approved' ? labels.approved : labels.rejected;
  return outcome.scope ? `${base} · ${outcome.scope}` : base;
}
