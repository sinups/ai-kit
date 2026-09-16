import React, { memo, useEffect, useState } from 'react';
import { Box } from '@mantine/core';
import { ToolRowBase } from '../ToolRowBase/ToolRowBase';
import type { ToolPart } from '../types';
import { cx } from '../utils/cx';
import { formatElapsedTime } from '../utils/format-elapsed';
import { getPartInput, getPartOutput, getToolStatus } from '../utils/format-tool';
import { GenericTool } from './GenericTool';
import { toolRegistry } from './tool-registry';
import classes from './SubagentTool.module.css';

export interface SubagentToolProps {
  /** Tool part in AI SDK v5 shape: `{ type, toolCallId, state, input, output }` */
  part: ToolPart;
  /** Tool parts executed by the subagent, rendered as nested rows */
  nestedTools?: ToolPart[];
  /** Chat status from `useChat()`, used to tell a pending tool from an interrupted one */
  chatStatus?: string;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

const MAX_VISIBLE_TOOLS = 5;

function getStartedAt(part: ToolPart): number | undefined {
  const meta = part.callProviderMetadata as { custom?: { startedAt?: number } } | undefined;
  return meta?.custom?.startedAt ?? (part.startedAt as number | undefined);
}

/** "Running Subagent" row that expands into the list of nested tool calls */
export const SubagentTool = memo(function SubagentTool({
  part,
  nestedTools = [],
  chatStatus,
  className,
  style,
}: SubagentToolProps) {
  const { isPending, isInterrupted } = getToolStatus(part, chatStatus);
  const input = getPartInput(part);
  const output = getPartOutput(part);
  const description: string = input.description || '';
  const [elapsedMs, setElapsedMs] = useState(0);
  const startedAt = getStartedAt(part);
  const hasNestedTools = nestedTools.length > 0;
  const outputDuration: number | undefined =
    output?.totalDurationMs || output?.duration || output?.duration_ms;

  useEffect(() => {
    if (isPending && startedAt) {
      setElapsedMs(Date.now() - startedAt);
      const interval = setInterval(() => {
        setElapsedMs(Date.now() - startedAt);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isPending, startedAt]);

  const subtitle = (() => {
    if (isPending && hasNestedTools) {
      const lastTool = nestedTools[nestedTools.length - 1];
      const meta = lastTool ? toolRegistry[lastTool.type] : null;
      if (meta && lastTool) {
        const title = meta.title(lastTool);
        const nestedSubtitle = meta.subtitle?.(lastTool);
        return nestedSubtitle ? `${title} ${nestedSubtitle}` : title;
      }
    }
    if (!description) {
      return '';
    }
    return description.length > 60 ? `${description.slice(0, 57)}...` : description;
  })();
  const elapsedTimeDisplay = formatElapsedTime(
    !isPending && outputDuration ? outputDuration : elapsedMs
  );

  if (isInterrupted && !part.output) {
    return (
      <ToolRowBase
        completeLabel="Subagent interrupted"
        isAnimating={false}
        className={className}
        style={style}
      />
    );
  }

  const isStreamingList = isPending && nestedTools.length > MAX_VISIBLE_TOOLS;

  return (
    <Box className={cx(classes.root, className)} style={style}>
      <ToolRowBase
        completeLabel="Completed Subagent"
        shimmerLabel="Running Subagent"
        isAnimating={isPending}
        detail={subtitle}
        expandable={hasNestedTools}
        trailingContent={
          elapsedTimeDisplay ? (
            <span className={classes.elapsed}>{elapsedTimeDisplay}</span>
          ) : undefined
        }
      >
        <div className={classes.body}>
          {isStreamingList && <div className={classes.mask} />}
          <div
            className={classes.list}
            data-multi={nestedTools.length > 1 || undefined}
            data-stream={isStreamingList || undefined}
          >
            {nestedTools.map((nestedPart, idx) => {
              const nestedMeta = toolRegistry[nestedPart.type];
              if (!nestedMeta) {
                return (
                  <ToolRowBase
                    key={idx}
                    completeLabel={nestedPart.type?.replace('tool-', '') ?? 'Tool'}
                    isAnimating={false}
                  />
                );
              }
              const { isPending: nestedIsPending, isError: nestedIsError } = getToolStatus(
                nestedPart,
                chatStatus
              );
              return (
                <GenericTool
                  key={idx}
                  icon={nestedMeta.icon}
                  title={nestedMeta.title(nestedPart)}
                  subtitle={nestedMeta.subtitle?.(nestedPart)}
                  isPending={nestedIsPending}
                  isError={nestedIsError}
                />
              );
            })}
          </div>
        </div>
      </ToolRowBase>
    </Box>
  );
});
