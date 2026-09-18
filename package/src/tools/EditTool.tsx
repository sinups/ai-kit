import React, { memo, useEffect, useMemo, useState } from 'react';
import { Box, UnstyledButton } from '@mantine/core';
import { IconChevronDown } from '@tabler/icons-react';
import { useToolComplete } from '../hooks/use-tool-complete';
import { FileExtIcon } from '../icons/FileExtIcon';
import { TextShimmer } from '../TextShimmer/TextShimmer';
import type { ToolPart } from '../types';
import type { SyntaxHighlighter } from '../utils/highlighter';
import type { StepState, ToolCallStep } from '../types/timeline';
import { useChatLabels } from '../labels/chat-labels';
import { cx } from '../utils/cx';
import { fillTemplate } from '../utils/fill-template';
import { getPartInput, getPartOutput } from '../utils/format-tool';
import { DiffView } from './DiffView';
import { ToolApprovalFooter, type ToolApproval } from './ToolApprovalFooter';
import { noopComplete, useToolStep } from './use-tool-step';
import classes from './EditTool.module.css';

export interface EditToolLabels {
  /** Header while the arguments stream in without a file name, `Generating...` by default */
  generating: string;
  /** Header while a new file is written, `{file}` is replaced, `Creating {file}` by default */
  creating: string;
  /** Header while a file is edited, `Editing {file}` by default */
  editing: string;
  /** Header once a new file is written, `Created {file}` by default */
  created: string;
  /** Header once a file is edited, `Edited {file}` by default */
  edited: string;
  /** Accessible label of the toggle that expands a clamped diff, `Show more` by default */
  expand: string;
  /** Accessible label of the toggle that clamps the diff again, `Hide` by default */
  collapse: string;
}

export const DEFAULT_EDIT_TOOL_LABELS: EditToolLabels = {
  generating: 'Generating...',
  creating: 'Creating {file}',
  editing: 'Editing {file}',
  created: 'Created {file}',
  edited: 'Edited {file}',
  expand: 'Show more',
  collapse: 'Hide',
};

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
  /** Highlights the changed words inside replaced lines, `false` by default */
  wordHighlight?: boolean;
  /** Wraps long diff lines instead of scrolling horizontally, `false` by default */
  wrapLines?: boolean;
  /** Colors the diff with this highlighter, the language comes from the file extension */
  highlighter?: SyntaxHighlighter;
  /** When set, renders `ToolApprovalFooter` with approve/reject buttons under the card */
  approval?: ToolApproval;
  /** Overrides of the default English labels */
  labels?: Partial<EditToolLabels>;
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
  wordHighlight = false,
  wrapLines = false,
  highlighter,
  approval,
  labels: labelsProp,
  className,
  style,
}: EditToolDiffCardProps) {
  useToolComplete(state === 'animating', step.duration, onComplete);
  const contextLabels = useChatLabels('editTool');
  const labels = { ...DEFAULT_EDIT_TOOL_LABELS, ...contextLabels, ...labelsProp };
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
          {isPending && !hasFileName ? (
            <TextShimmer as="span" duration={1.2} className={classes.shimmer}>
              {labels.generating}
            </TextShimmer>
          ) : isPending ? (
            <TextShimmer as="span" duration={1.2} className={classes.shimmer}>
              {fillTemplate(isWrite ? labels.creating : labels.editing, { file: fileName ?? '' })}
            </TextShimmer>
          ) : (
            <span className={classes.title}>
              {fillTemplate(isWrite ? labels.created : labels.edited, { file: fileName ?? '' })}
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
            <DiffView
              oldText={diffContents.oldContents}
              newText={diffContents.newContents}
              wordHighlight={wordHighlight}
              wrapLines={wrapLines}
              highlighter={highlighter}
              language={fileName?.split('.').pop()}
            />
          </div>
          {isCollapsible && (
            <UnstyledButton
              className={classes.expandButton}
              onClick={() => setIsExpanded((prev) => !prev)}
              aria-label={isExpanded ? labels.collapse : labels.expand}
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

export interface EditToolProps {
  /** Tool part in AI SDK v5 shape: `{ type, toolCallId, state, input, output }` */
  part: ToolPart;
  /** Clamp the diff to 260px with a "Show more" toggle, `false` by default */
  isCollapsible?: boolean;
  /** Highlights the changed words inside replaced lines, `false` by default */
  wordHighlight?: boolean;
  /** Wraps long diff lines instead of scrolling horizontally, `false` by default */
  wrapLines?: boolean;
  /** Colors the diff with this highlighter, the language comes from the file extension */
  highlighter?: SyntaxHighlighter;
  /** Overrides of the default English labels */
  labels?: Partial<EditToolLabels>;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

/** Renders `tool-Edit` / `tool-Write` parts as a diff card */
export const EditTool = memo(function EditTool({
  part,
  isCollapsible = false,
  wordHighlight = false,
  wrapLines = false,
  highlighter,
  labels,
  className,
  style,
}: EditToolProps) {
  const input = getPartInput(part);
  const output = getPartOutput(part);
  const approval = input.approval as ToolApproval | undefined;
  const toolName = part.type?.replace('tool-', '') || 'Edit';
  const { step, stepState } = useToolStep(part, toolName, 'edit');
  const isStreaming = part.state === 'input-streaming';
  const cardStep = useMemo(
    () => (isStreaming ? { ...step, diffLines: undefined } : step),
    [isStreaming, step]
  );

  return (
    <EditToolDiffCard
      step={cardStep}
      state={stepState}
      onComplete={noopComplete}
      input={isStreaming ? undefined : input}
      output={!isStreaming && output && typeof output === 'object' ? output : undefined}
      isCollapsible={isCollapsible}
      wordHighlight={wordHighlight}
      wrapLines={wrapLines}
      highlighter={highlighter}
      approval={approval}
      labels={labels}
      className={className}
      style={style}
    />
  );
});

EditTool.displayName = 'EditTool';
