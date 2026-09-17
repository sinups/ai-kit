import React, { memo } from 'react';
import { Stack } from '@mantine/core';
import { ToolRowBase } from '../ToolRowBase/ToolRowBase';
import type {
  CustomToolRendererProps,
  ToolActionHandler,
  ToolPart,
  ToolRendererSlotProps,
} from '../types';
import { getToolStatus } from '../utils/format-tool';
import {
  DEFAULT_TOOL_RUN_LABELS,
  describePendingToolRun,
  describeToolRunPhrases,
  type ToolRunLabels,
} from './tool-runs';

export interface ToolRunGroupProps {
  /** Consecutive tool parts collapsed into one row */
  parts: ToolPart[];
  /** Chat status passed to every tool, `streaming` keeps unfinished calls animated */
  chatStatus?: string;
  /** Renderer used for each tool when the group is expanded */
  ToolRendererComponent: React.ComponentType<ToolRendererSlotProps>;
  toolRenderers?: Record<string, React.ComponentType<CustomToolRendererProps>>;
  /** Receives actions reported by custom tool renderers */
  onToolAction?: ToolActionHandler;
  /** Wraps long lines in diffs instead of scrolling them sideways */
  wrapLines?: boolean;
  /** Summary and progress labels, English by default */
  labels?: ToolRunLabels;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

/** Collapsed summary row for a run of similar tool calls, expands into the individual calls */
export const ToolRunGroup = memo(function ToolRunGroup({
  parts,
  chatStatus,
  ToolRendererComponent,
  toolRenderers,
  onToolAction,
  wrapLines,
  labels = DEFAULT_TOOL_RUN_LABELS,
  className,
  style,
}: ToolRunGroupProps) {
  const pendingPart = [...parts]
    .reverse()
    .find((part) => getToolStatus(part, chatStatus).isPending);

  const [label = '', ...rest] = describeToolRunPhrases(parts, labels);

  return (
    <ToolRowBase
      completeLabel={label}
      shimmerLabel={describePendingToolRun(pendingPart, labels)}
      isAnimating={Boolean(pendingPart)}
      detail={pendingPart ? undefined : rest.join(', ')}
      expandable
      className={className}
      style={style}
      data-tool-run
    >
      <Stack gap={10} pl={16}>
        {parts.map((part, index) => (
          <ToolRendererComponent
            key={part.toolCallId ?? index}
            part={part}
            chatStatus={chatStatus}
            toolRenderers={toolRenderers}
            onToolAction={onToolAction}
            wrapLines={wrapLines}
          />
        ))}
      </Stack>
    </ToolRowBase>
  );
});

ToolRunGroup.displayName = 'ToolRunGroup';
