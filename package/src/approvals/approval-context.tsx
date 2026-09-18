import React, { createContext, useContext, useMemo } from 'react';
import type { ToolApproval, ToolApprovalLabels } from '../tools/ToolApprovalFooter';
import {
  deriveToolCallState,
  type DeriveToolCallStateOptions,
  type ToolCallState,
} from '../tools/tool-call-state';
import type { ToolPart } from '../types';

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

type ToolApprovalsContextValue = {
  approvals?: ToolApprovals;
  labels?: Partial<ToolApprovalLabels>;
};

const ToolApprovalsContext = createContext<ToolApprovalsContextValue>({});

export interface ToolApprovalsProviderProps {
  /** Approval requests keyed by `toolCallId` */
  approvals?: ToolApprovals;
  /** Labels of every approval inside, under the `labels` of each request */
  labels?: Partial<ToolApprovalLabels>;
  children: React.ReactNode;
}

/** Makes host approval requests available to every tool call rendered inside it */
export function ToolApprovalsProvider({ approvals, labels, children }: ToolApprovalsProviderProps) {
  const value = useMemo(() => ({ approvals, labels }), [approvals, labels]);
  return <ToolApprovalsContext.Provider value={value}>{children}</ToolApprovalsContext.Provider>;
}

ToolApprovalsProvider.displayName = 'ToolApprovalsProvider';

/** Every approval request of the host by `toolCallId`, `undefined` outside of a provider */
export function useToolApprovals(): ToolApprovals | undefined {
  return useContext(ToolApprovalsContext).approvals;
}

/**
 * Approval request attached to this call, `undefined` when the host has none for it. Its `labels`
 * already carry the labels of the provider underneath its own.
 */
export function useToolApproval(toolCallId?: string): ToolApprovalRequest | undefined {
  const { approvals, labels } = useContext(ToolApprovalsContext);
  const request = approvals && toolCallId ? approvals[toolCallId] : undefined;
  return useMemo(() => {
    if (!request || !labels) {
      return request;
    }
    return {
      ...request,
      labels: {
        ...labels,
        ...request.labels,
        risk: { ...labels.risk, ...request.labels?.risk },
      },
    };
  }, [request, labels]);
}

/**
 * Visible state of a call with the host approval request applied over the transcript: an open
 * request waits for a decision and a refused one is skipped, whatever the part says yet.
 */
export function resolveToolCallState(
  part: ToolPart,
  request: ToolApprovalRequest | undefined,
  options?: DeriveToolCallStateOptions
): ToolCallState {
  if (request && !request.outcome) {
    return 'awaiting-permission';
  }
  if (request?.outcome?.decision === 'rejected') {
    return 'rejected';
  }
  return deriveToolCallState(part, options);
}
