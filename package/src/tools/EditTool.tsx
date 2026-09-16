import React, { memo, useEffect, useMemo, useState } from 'react';
import { Box, UnstyledButton } from '@mantine/core';
import { IconChevronDown } from '@tabler/icons-react';
import { useToolComplete } from '../hooks/use-tool-complete';
import { FileExtIcon } from '../icons/FileExtIcon';
import { TextShimmer } from '../TextShimmer/TextShimmer';
import type { ToolPart } from '../types';
import type { StepState, ToolCallStep } from '../types/timeline';
import { cx } from '../utils/cx';
import { getLegacyToolState, getPartInput, getPartOutput } from '../utils/format-tool';
import { mapToolInvocationToStep, mapToolStateToStepState } from '../utils/tool-adapters';
import { DiffView } from './DiffView';
import { ToolApprovalFooter, type ToolApproval } from './ToolApprovalFooter';
import classes from './EditTool.module.css';

export interface EditToolDiffCardProps {
  /** Timeline step describing the tool call */
  step: ToolCallStep;
  /** Animation state of the step, the card shows shimmer while `animating` */
  state: StepState;
  /** Called once `step.duration` elapses while animating */
  onComplete: () => void;
  /** Raw tool input, `old_string`/`new_string` are used to build the diff */
  input?: Record<string, unknown>;
  /** Raw tool output, `old_content`/`content` take precedence over input */
  output?: Record<string, unknown>;
  /** Clamp the diff to 260px with a "Show more" toggle */
  isCollapsible?: boolean;
  /** When set, renders `ToolApprovalFooter` with approve/reject buttons under the card */
  approval?: ToolApproval;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

/** Card with file header, +/- stats and a unified diff body */
export function EditToolDiffCard({
  step,
  state,
  onComplete,
  input,
  output,
  isCollapsible = false,
  approval,
  className,
  style,
}: EditToolDiffCardProps) {
  useToolComplete(state === 'animating', step.duration, onComplete);
  const isPending = state === 'animating';
  const fileName = step.filePath?.split('/').pop() ?? step.toolDetail;
  const hasFileName = Boolean(fileName);
  const isWrite = step.toolName === 'Write';
  const [isExpanded, setIsExpanded] = useState(!isCollapsible);

  useEffect(() => {
    setIsExpanded(!isCollapsible);
  }, [isCollapsible]);

  const diffContents = useMemo(() => {
    const oldFromOutput = typeof output?.old_content === 'string' ? output.old_content : undefined;
    const newFromOutput = typeof output?.content === 'string' ? output.content : undefined;
    const oldFromInput =
      !oldFromOutput && typeof input?.old_string === 'string' ? input.old_string : undefined;
    const newFromInput =
      !newFromOutput && typeof input?.new_string === 'string' ? input.new_string : undefined;

    const fallbackOld = step.diffLines
      ?.filter((line) => line.type !== 'add')
      .map((line) => line.content)
      .join('\n');
    const fallbackNew = step.diffLines
      ?.filter((line) => line.type !== 'remove')
      .map((line) => line.content)
      .join('\n');

    const oldContents = oldFromInput ?? oldFromOutput ?? fallbackOld ?? '';
    const newContents = newFromInput ?? newFromOutput ?? fallbackNew ?? '';

    if (!oldContents && !newContents) {
      return null;
    }
    return { oldContents, newContents };
  }, [input, output, step.diffLines]);

  const collapsed = isCollapsible && !isExpanded;

  return (
    <Box className={cx(classes.card, className)} style={style}>
      <div className={classes.header} data-bordered={!isPending || !!diffContents || undefined}>
        <div className={classes.headerContent}>
          {hasFileName && <FileExtIcon filename={fileName} size={12} />}
          {isPending && !diffContents ? (
            <TextShimmer as="span" duration={1.2} className={classes.shimmer}>
              Generating...
            </TextShimmer>
          ) : isPending ? (
            <TextShimmer as="span" duration={1.2} className={classes.shimmer}>
              {isWrite ? 'Creating' : 'Editing'} {fileName}
            </TextShimmer>
          ) : (
            <span className={classes.title}>
              {isWrite ? 'Created' : 'Edited'} {fileName}
            </span>
          )}
        </div>
        {step.diffStats && !isPending && (
          <span className={classes.stats}>
            {step.diffStats.split(' ').map((token) => (
              <span
                key={token}
                className={classes.stat}
                data-kind={
                  token.startsWith('+') ? 'added' : token.startsWith('-') ? 'removed' : undefined
                }
              >
                {token}
              </span>
            ))}
          </span>
        )}
      </div>
      {diffContents ? (
        <div className={classes.diffWrap}>
          <div className={classes.clamp} data-collapsed={collapsed || undefined}>
            <DiffView oldText={diffContents.oldContents} newText={diffContents.newContents} />
          </div>
          {isCollapsible && (
            <UnstyledButton
              className={classes.expandButton}
              onClick={() => setIsExpanded((prev) => !prev)}
              aria-label={isExpanded ? 'Hide' : 'Show more'}
              data-collapsed={collapsed || undefined}
            >
              <IconChevronDown
                size={16}
                className={classes.chevron}
                data-expanded={isExpanded || undefined}
              />
            </UnstyledButton>
          )}
        </div>
      ) : null}
      {approval && <ToolApprovalFooter isPending={isPending} {...approval} />}
    </Box>
  );
}

export interface EditToolProps {
  /** Tool part in AI SDK v5 shape: `{ type, toolCallId, state, input, output }` */
  part: ToolPart;
  /** Clamp the diff to 260px with a "Show more" toggle, `false` by default */
  isCollapsible?: boolean;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

/** Renders `tool-Edit` / `tool-Write` parts as a diff card */
export const EditTool = memo(function EditTool({
  part,
  isCollapsible = false,
  className,
  style,
}: EditToolProps) {
  const input = getPartInput(part);
  const output = getPartOutput(part);
  const approval = input.approval as ToolApproval | undefined;
  const toolName = part.type?.replace('tool-', '') || 'Edit';
  const legacyState = getLegacyToolState(part);
  const step = mapToolInvocationToStep(part.toolCallId ?? (part.id as string) ?? 'edit', {
    toolName,
    args: input,
    state: legacyState,
    result: output,
  });
  const stepState = mapToolStateToStepState(legacyState);
  const noop = () => {};

  return (
    <EditToolDiffCard
      step={step}
      state={stepState}
      onComplete={noop}
      input={input}
      output={output && typeof output === 'object' ? output : undefined}
      isCollapsible={isCollapsible}
      approval={approval}
      className={className}
      style={style}
    />
  );
});
