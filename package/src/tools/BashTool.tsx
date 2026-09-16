import React, { memo } from 'react';
import { Box } from '@mantine/core';
import { useToolComplete } from '../hooks/use-tool-complete';
import { IconThinSpinner } from '../icons';
import { TextShimmer } from '../TextShimmer/TextShimmer';
import type { ToolPart } from '../types';
import type { StepState, ToolCallStep } from '../types/timeline';
import { cx } from '../utils/cx';
import { getPartInput } from '../utils/format-tool';
import { ToolApprovalFooter, type ToolApproval } from './ToolApprovalFooter';
import { noopComplete, useToolStep } from './use-tool-step';
import classes from './BashTool.module.css';

function extractCommandSummary(cmd: string): string {
  return cmd
    .split('|')
    .map((s) => s.trim().split(/\s+/)[0] ?? '')
    .filter(Boolean)
    .slice(0, 4)
    .join(', ');
}

export interface BashToolTerminalCardProps {
  /** Timeline step describing the tool call */
  step: ToolCallStep;
  /** Animation state of the step, the card shows shimmer while `animating` */
  state: StepState;
  /** Called once `step.duration` elapses while animating */
  onComplete: () => void;
  /** When set, renders `ToolApprovalFooter` with approve/reject buttons under the card */
  approval?: ToolApproval;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

/** Terminal-style card showing the command and (once finished) its output */
export function BashToolTerminalCard({
  step,
  state,
  onComplete,
  approval,
  className,
  style,
}: BashToolTerminalCardProps) {
  useToolComplete(state === 'animating', step.duration, onComplete);
  const isPending = state === 'animating';
  const command = step.bashCommand ?? step.toolDetail;
  const summary = extractCommandSummary(command);

  return (
    <Box className={cx(classes.card, className)} style={style}>
      <div className={classes.header}>
        <div className={classes.headerContent}>
          {isPending ? (
            <TextShimmer as="span" duration={1.2} className={classes.shimmer}>
              Running command: {summary}
            </TextShimmer>
          ) : (
            <span className={classes.title}>Ran command: {summary}</span>
          )}
        </div>
        {isPending && <IconThinSpinner size={12} className={classes.spinner} />}
      </div>
      <div className={classes.body}>
        <div className={classes.commandLine}>
          <span className={classes.prompt}>$ </span>
          <span className={classes.command}>{command}</span>
        </div>
        {!isPending && step.bashOutput && <div className={classes.output}>{step.bashOutput}</div>}
      </div>
      {approval && <ToolApprovalFooter isPending={isPending} {...approval} />}
    </Box>
  );
}

export interface BashToolProps {
  /** Tool part in AI SDK v5 shape: `{ type, toolCallId, state, input, output }` */
  part: ToolPart;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

/** Renders a `tool-Bash` part as a terminal card */
export const BashTool = memo(function BashTool({ part, className, style }: BashToolProps) {
  const input = getPartInput(part);
  const approval = input.approval as ToolApproval | undefined;
  const { step, stepState } = useToolStep(part, 'Bash', 'bash');

  return (
    <BashToolTerminalCard
      step={step}
      state={stepState}
      onComplete={noopComplete}
      approval={approval}
      className={className}
      style={style}
    />
  );
});
