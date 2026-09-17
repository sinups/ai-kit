import React, { memo, useState } from 'react';
import { Box, UnstyledButton } from '@mantine/core';
import { IconChevronsDown, IconChevronsUp, IconFileDescription } from '@tabler/icons-react';
import { IconSpinner } from '../icons';
import { Markdown } from '../Markdown/Markdown';
import type { ToolPart } from '../types';
import { cx } from '../utils/cx';
import { areToolPropsEqual, getPartInput, getToolStatus } from '../utils/format-tool';
import classes from './PlanTool.module.css';

export type Plan = {
  /** Plan id, used to build the file name (`plan-<id>.md`) */
  id?: string;
  /** Plan title shown under the header */
  title: string;
  /** Markdown summary, collapsed to 94px until expanded */
  summary?: string;
};

/** Shape of `part.input` accepted by `PlanTool` */
type PlanToolInput = {
  plan?: Plan;
  /** Called once when the approve button is clicked */
  onApprove?: () => void;
  /** Approve button label, `labels.approve` by default */
  approveLabel?: string;
  /** Marks the plan as already approved, hides the button */
  approved?: boolean;
};

export interface PlanToolLabels {
  /** Approve button, `Approve` by default */
  approve: string;
  /** Approve button once the plan is approved, `Approved` by default */
  approved: string;
  /** Accessible label of the collapse toggle, `Collapse plan` by default */
  collapse: string;
  /** Accessible label of the expand toggle, `Expand plan` by default */
  expand: string;
  /** Button that expands the summary, `Read detailed plan` by default */
  readMore: string;
  /** Button that collapses the summary, `Hide detailed plan` by default */
  readLess: string;
  /** Shown instead of the summary when the plan has none, `No plan summary provided.` by default */
  noSummary: string;
}

export const DEFAULT_PLAN_TOOL_LABELS: PlanToolLabels = {
  approve: 'Approve',
  approved: 'Approved',
  collapse: 'Collapse plan',
  expand: 'Expand plan',
  readMore: 'Read detailed plan',
  readLess: 'Hide detailed plan',
  noSummary: 'No plan summary provided.',
};

export interface PlanToolProps {
  /** Tool part in AI SDK v5 shape: `{ type, toolCallId, state, input, output }` */
  part: ToolPart;
  /** Chat status from `useChat()`, used to tell a pending tool from an interrupted one */
  chatStatus?: string;
  /** Overrides of the default English labels */
  labels?: Partial<PlanToolLabels>;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

function getPlanFileName(plan: Plan) {
  const rawId = plan.id?.trim();
  if (!rawId) {
    return 'plan-working.md';
  }
  if (rawId.endsWith('.md')) {
    return rawId;
  }
  return `plan-${rawId}.md`;
}

/** Renders a `tool-PlanWrite` part: plan file card with title, collapsible summary and approve button */
export const PlanTool = memo(function PlanTool({
  part,
  chatStatus,
  labels: labelsProp,
  className,
  style,
}: PlanToolProps) {
  const labels = { ...DEFAULT_PLAN_TOOL_LABELS, ...labelsProp };
  const { isPending } = getToolStatus(part, chatStatus);
  const input = getPartInput(part) as PlanToolInput;
  const plan = input.plan;
  const [isExpanded, setIsExpanded] = useState(false);
  const [isApproved, setIsApproved] = useState(false);

  if (!plan) {
    return null;
  }

  const fileName = getPlanFileName(plan);
  const summary = plan.summary?.trim() ?? '';
  const hasSummary = summary.length > 0;

  const approveLabel = input.approveLabel ?? labels.approve;
  const isAlreadyApproved = input.approved || isApproved;
  const approveText = isAlreadyApproved ? labels.approved : approveLabel;

  const handleApprove = () => {
    if (isAlreadyApproved) {
      return;
    }
    setIsApproved(true);
    if (typeof input.onApprove === 'function') {
      input.onApprove();
    }
  };

  const approveButton = !isAlreadyApproved && (
    <UnstyledButton className={classes.approve} onClick={handleApprove}>
      {approveText}
    </UnstyledButton>
  );

  return (
    <Box className={cx(classes.card, className)} style={style}>
      <div className={classes.header}>
        <div className={classes.headerContent}>
          {isPending ? (
            <IconSpinner size={12} className={classes.headerIcon} />
          ) : (
            <IconFileDescription size={14} className={classes.headerIcon} />
          )}
          <span className={classes.fileName}>{fileName}</span>
        </div>
        <UnstyledButton
          className={classes.toggle}
          onClick={() => setIsExpanded((prev) => !prev)}
          aria-label={isExpanded ? labels.collapse : labels.expand}
        >
          {isExpanded ? <IconChevronsUp size={14} /> : <IconChevronsDown size={14} />}
        </UnstyledButton>
      </div>

      <div className={classes.body}>
        <div className={classes.content}>
          <div className={classes.title}>{plan.title}</div>

          {hasSummary ? (
            <div className={classes.summaryWrap}>
              <div className={classes.summary} data-collapsed={!isExpanded || undefined}>
                <Markdown content={summary} className={classes.markdown} />
              </div>

              {!isExpanded && (
                <div className={classes.fade}>
                  <div className={classes.fadeGradient} />
                  <div className={classes.fadeActions}>
                    <UnstyledButton
                      className={cx(classes.readMore, classes.readMoreInset)}
                      onClick={() => setIsExpanded(true)}
                    >
                      {labels.readMore}
                    </UnstyledButton>
                    {approveButton}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className={classes.noSummary}>{labels.noSummary}</div>
          )}
        </div>

        {(isExpanded || !hasSummary) && (
          <div className={classes.footer}>
            <UnstyledButton
              className={cx(classes.readMore, classes.readMoreInset)}
              onClick={() => setIsExpanded((prev) => !prev)}
            >
              {isExpanded ? labels.readLess : labels.readMore}
            </UnstyledButton>
            {approveButton}
          </div>
        )}
      </div>
    </Box>
  );
}, areToolPropsEqual);

PlanTool.displayName = 'PlanTool';
