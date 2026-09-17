import React, { memo, useMemo } from 'react';
import { Box } from '@mantine/core';
import { useToolComplete } from '../hooks/use-tool-complete';
import { IconThinSpinner } from '../icons';
import { TextShimmer } from '../TextShimmer/TextShimmer';
import type { ToolPart } from '../types';
import type { StepState, ToolCallStep } from '../types/timeline';
import { cx } from '../utils/cx';
import { getPartInput } from '../utils/format-tool';
import { getBashRunInfo, type BashRunInfo } from './bash-output';
import { ShellOutput } from './ShellOutput';
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

function toSingleLine(command: string): string {
  return command.replace(/\s+/g, ' ').trim();
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
  /** Output and run metadata used by `withOutputMeta` and `formatOutput`, which also stream `run.output` while the command runs */
  run?: BashRunInfo;
  /** Output lines shown from the end with `formatOutput`, `8` by default */
  maxOutputLines?: number;
  /** Shows exit code, duration, timeout, size and a copy button above the output, `false` by default */
  withOutputMeta?: boolean;
  /** Renders ANSI colors, clickable links, pretty JSON and a Show all toggle in the output */
  formatOutput?: boolean;
  /** Header text: `short` lists the programs of a pipeline (`ls, grep`), `full` shows the whole command on one line, `short` by default */
  commandSummary?: 'short' | 'full';
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
  run,
  maxOutputLines = 8,
  withOutputMeta = false,
  formatOutput = false,
  commandSummary = 'short',
  className,
  style,
}: BashToolTerminalCardProps) {
  useToolComplete(state === 'animating', step.duration, onComplete);
  const isPending = state === 'animating';
  const command = step.bashCommand ?? step.toolDetail;
  const summary =
    commandSummary === 'full' ? toSingleLine(command) : extractCommandSummary(command);
  const rich = withOutputMeta || formatOutput;
  const output = rich
    ? (run?.output ?? (isPending ? undefined : step.bashOutput))
    : isPending
      ? undefined
      : (step.bashOutput ?? run?.output);

  return (
    <Box className={cx(classes.card, className)} style={style}>
      <div className={classes.header}>
        <div
          className={classes.headerContent}
          title={commandSummary === 'full' ? summary : undefined}
        >
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
        {rich
          ? (Boolean(output) || (withOutputMeta && !isPending && run?.exitCode !== undefined)) && (
              <ShellOutput
                variant="compact"
                className={classes.rich}
                output={output ?? ''}
                live={isPending}
                maxLines={formatOutput ? maxOutputLines : 0}
                formatJson={formatOutput}
                withMeta={withOutputMeta}
                withCopy={withOutputMeta}
                exitCode={isPending ? undefined : run?.exitCode}
                durationMs={run?.durationMs}
                startedAt={run?.startedAt}
                timeoutMs={run?.timeoutMs}
                sizeBytes={run?.sizeBytes}
              />
            )
          : output && <div className={classes.output}>{output}</div>}
      </div>
      {approval && (
        <ToolApprovalFooter
          isPending={isPending}
          isComplete={Boolean(approval.hideWhenComplete) && state === 'complete'}
          {...approval}
        />
      )}
    </Box>
  );
}

export interface BashToolProps {
  /** Tool part in AI SDK v5 shape: `{ type, toolCallId, state, input, output }` */
  part: ToolPart;
  /** Shows exit code, duration, timeout, size and a copy button above the output, `false` by default */
  withOutputMeta?: boolean;
  /** Renders ANSI colors, clickable links, pretty JSON and a Show all toggle in the output */
  formatOutput?: boolean;
  /** Header text: `short` lists the programs of a pipeline (`ls, grep`), `full` shows the whole command on one line, `short` by default */
  commandSummary?: 'short' | 'full';
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

/** Renders a `tool-Bash` part as a terminal card */
export const BashTool = memo(function BashTool({
  part,
  withOutputMeta,
  formatOutput,
  commandSummary,
  className,
  style,
}: BashToolProps) {
  const input = getPartInput(part);
  const approval = input.approval as ToolApproval | undefined;
  const { step, stepState } = useToolStep(part, 'Bash', 'bash');
  const run = useMemo(() => getBashRunInfo(part), [part]);

  return (
    <BashToolTerminalCard
      step={step}
      state={stepState}
      onComplete={noopComplete}
      approval={approval}
      run={run}
      withOutputMeta={withOutputMeta}
      formatOutput={formatOutput}
      commandSummary={commandSummary}
      className={className}
      style={style}
    />
  );
});

BashTool.displayName = 'BashTool';
