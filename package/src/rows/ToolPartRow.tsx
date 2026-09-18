import React from 'react';
import type { ToolPart } from '../types';
import { ToolActivity } from '../tools/ToolActivity';
import { getToolProgress } from '../tools/tool-progress';
import {
  DEFAULT_TOOL_CALL_STATE_LABELS,
  deriveToolCallState,
  type ToolCallLookups,
  type ToolCallStateLabels,
} from '../tools/tool-call-state';
import { useElapsed } from '../tools/use-elapsed';
import { ToolApprovalFooter } from '../tools/ToolApprovalFooter';
import {
  DEFAULT_TOOL_APPROVAL_OUTCOME_LABELS,
  useToolApproval,
  type ToolApprovalOutcomeLabels,
} from '../approvals/tool-approvals';
import { fillTemplate } from '../utils/fill-template';
import { ResponseRow } from './ResponseRow';
import { ToolCallRow } from './ToolCallRow';
import { clampLines, getToolRowArgs, getToolRowName, getToolRowOutput } from './rows-format';
import { getEditSummary } from './rows-summary';
import classes from './Rows.module.css';

const OUTPUT_LINES = 3;
const ERROR_LINES = 10;

export interface ToolPartRowLabels extends ToolCallStateLabels, ToolApprovalOutcomeLabels {
  /** Tail of a clipped output, `… +N lines` by default */
  hiddenLines: (count: number) => string;
  /** Row of a call that is running without progress, `Running…` by default */
  running: string;
  /** Row of a finished call that printed nothing, `(No output)` by default */
  noOutput: string;
  /** Result of an edit, `Updated {file} with {added} additions and {removed} removals` by default */
  edited: string;
}

export const DEFAULT_TOOL_PART_ROW_LABELS: ToolPartRowLabels = {
  ...DEFAULT_TOOL_CALL_STATE_LABELS,
  ...DEFAULT_TOOL_APPROVAL_OUTCOME_LABELS,
  hiddenLines: (count) => `… +${count} ${count === 1 ? 'line' : 'lines'}`,
  running: 'Running…',
  noOutput: '(No output)',
  edited: 'Updated {file} with {added} additions and {removed} removals',
};

export interface ToolPartRowProps {
  /** Tool part in AI SDK v5 shape: `{ type, toolCallId, state, input, output }` */
  part: ToolPart;
  /** Chat status from `useChat()`, used to tell a running call from an interrupted one */
  chatStatus?: string;
  /** Transcript lookups behind the visible state of the call, see `createToolCallLookups` */
  lookups?: ToolCallLookups;
  /** Shows how long the call has been running and the progress its server reports */
  showActivity?: boolean;
  /**
   * Permission request of the host, rendered under the gutter instead of the waiting line. Taken
   * from the `approvals` of `AgentChat` for this call id when omitted.
   */
  approval?: React.ReactNode;
  /** Overrides of the default English labels */
  labels?: Partial<ToolPartRowLabels>;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

/** A tool call of the transcript as flat rows: the call itself and the rows that answer it */
export function ToolPartRow({
  part,
  chatStatus,
  lookups,
  showActivity = false,
  approval,
  labels: labelsProp,
  className,
  style,
}: ToolPartRowProps) {
  const labels = { ...DEFAULT_TOOL_PART_ROW_LABELS, ...labelsProp };
  const hostApproval = useToolApproval(part.toolCallId);
  const state = deriveToolCallState(part, { chatStatus, lookups });
  const isRunning = state === 'running';
  const isSettled = state === 'done' || state === 'error';
  const elapsed = useElapsed(part, showActivity && isRunning);
  const progress = showActivity && isRunning ? getToolProgress(part) : undefined;

  const { isPending: approvalPending, outcome, ...approvalFooter } = hostApproval ?? {};
  const approvalNode =
    approval ??
    (hostApproval && !outcome ? (
      <ToolApprovalFooter {...approvalFooter} isPending={approvalPending} />
    ) : undefined);
  const outcomeText = outcome
    ? (outcome.label ??
      `${outcome.decision === 'approved' ? labels.approved : labels.rejected}${
        outcome.scope ? ` · ${outcome.scope}` : ''
      }`)
    : undefined;

  const editSummary = isSettled ? getEditSummary(part) : undefined;
  const output = isSettled && !editSummary ? getToolRowOutput(part) : '';
  const clamped = clampLines(output, state === 'error' ? ERROR_LINES : OUTPUT_LINES);

  return (
    <ToolCallRow
      name={getToolRowName(part)}
      args={getToolRowArgs(part)}
      state={state}
      className={className}
      style={style}
      trailingContent={elapsed ? <ToolActivity elapsed={elapsed} /> : undefined}
    >
      {approvalNode && <ResponseRow>{approvalNode}</ResponseRow>}
      {outcomeText && <ResponseRow tone="muted">{outcomeText}</ResponseRow>}
      {!approvalNode && !outcomeText && state === 'awaiting-permission' && (
        <ResponseRow tone="muted">{labels.awaitingPermission}</ResponseRow>
      )}
      {state === 'queued' && <ResponseRow tone="muted">{labels.queued}</ResponseRow>}
      {state === 'rejected' && <ResponseRow tone="muted">{labels.rejected}</ResponseRow>}
      {isRunning &&
        (progress ? (
          <ResponseRow tone="muted">
            <ToolActivity progress={progress} />
          </ResponseRow>
        ) : (
          <ResponseRow tone="muted">{labels.running}</ResponseRow>
        ))}
      {editSummary && (
        <ResponseRow>
          {fillTemplate(labels.edited, {
            file: editSummary.file,
            added: String(editSummary.added),
            removed: String(editSummary.removed),
          })}
        </ResponseRow>
      )}
      {isSettled && !editSummary && !clamped.text && (
        <ResponseRow tone="muted">{labels.noOutput}</ResponseRow>
      )}
      {clamped.text && (
        <ResponseRow tone={state === 'error' ? 'error' : 'default'}>
          {clamped.text}
          {clamped.hidden > 0 && (
            <span className={classes.hiddenLines}>{labels.hiddenLines(clamped.hidden)}</span>
          )}
        </ResponseRow>
      )}
    </ToolCallRow>
  );
}

ToolPartRow.displayName = 'ToolPartRow';
