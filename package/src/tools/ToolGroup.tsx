import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import { ToolRowBase } from '../ToolRowBase/ToolRowBase';
import type { ToolPart } from '../types';
import { getPartInput, getToolStatus } from '../utils/format-tool';
import { GenericTool } from './GenericTool';
import { COMMAND_TOOL_TYPES, FILE_TOOL_TYPES, SEARCH_TOOL_TYPES } from './tool-kinds';
import { toolRegistry } from './tool-registry';
import { useElapsed } from './use-elapsed';
import classes from './ToolGroup.module.css';

export interface ToolGroupProps {
  /** Tool part in AI SDK v5 shape: `{ type, toolCallId, state, input, output }` */
  part: ToolPart;
  /** Tool parts executed inside this group, rendered as nested rows */
  nestedTools?: ToolPart[];
  /** Chat status from `useChat()`, used to tell a pending tool from an interrupted one */
  chatStatus?: string;
  /** Row label once the group has finished */
  completeLabel: string;
  /** Shimmer label while the group is running */
  shimmerLabel?: string;
  /** Row label when the chat stopped before the group finished */
  interruptedLabel: string;
  /** Rows visible in the streaming viewport, `5` by default */
  maxVisibleTools?: number;
  /** Auto-expand the group when it starts running, `false` disables it */
  defaultOpen?: boolean;
  /** Show elapsed time at the end of the row, `true` by default */
  showElapsed?: boolean;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

function formatCount(value: number, label: string): string {
  return `${value} ${value === 1 ? label : `${label}s`}`;
}

function formatSearches(count: number): string {
  return `${count} ${count === 1 ? 'search' : 'searches'}`;
}

function summarizeNestedTools(nestedTools: ToolPart[]): string {
  if (nestedTools.length === 0) {
    return '';
  }

  let fileCount = 0;
  let searchCount = 0;
  let commandCount = 0;

  for (const tool of nestedTools) {
    if (FILE_TOOL_TYPES.has(tool.type)) {
      fileCount += 1;
    } else if (SEARCH_TOOL_TYPES.has(tool.type)) {
      searchCount += 1;
    } else if (COMMAND_TOOL_TYPES.has(tool.type)) {
      commandCount += 1;
    }
  }

  const parts: string[] = [];
  if (fileCount > 0) {
    parts.push(formatCount(fileCount, 'file'));
  }
  if (searchCount > 0) {
    parts.push(formatSearches(searchCount));
  }
  if (commandCount > 0) {
    parts.push(formatCount(commandCount, 'command'));
  }

  if (parts.length === 0) {
    return '';
  }
  if (parts.length === 1) {
    return parts[0];
  }
  if (parts.length === 2) {
    return `${parts[0]} and ${parts[1]}`;
  }
  return `${parts.slice(0, -1).join(', ')}, and ${parts[parts.length - 1]}`;
}

function getNestedCounts(nestedTools: ToolPart[]) {
  let fileCount = 0;
  let searchCount = 0;
  for (const tool of nestedTools) {
    if (FILE_TOOL_TYPES.has(tool.type)) {
      fileCount += 1;
    } else if (SEARCH_TOOL_TYPES.has(tool.type)) {
      searchCount += 1;
    }
  }
  return { fileCount, searchCount };
}

function formatStreamCounts(fileCount: number, searchCount: number): string {
  const parts: string[] = [];
  if (fileCount > 0) {
    parts.push(formatCount(fileCount, 'file'));
  }
  if (searchCount > 0) {
    parts.push(formatSearches(searchCount));
  }
  return parts.join(', ');
}

/** Expandable group of nested tool calls (Task/Agent) with streaming reveal animation */
export const ToolGroup = memo(function ToolGroup({
  part,
  nestedTools = [],
  chatStatus,
  completeLabel,
  shimmerLabel,
  interruptedLabel,
  maxVisibleTools = 5,
  defaultOpen,
  showElapsed = true,
  className,
  style,
}: ToolGroupProps) {
  const { isPending, isInterrupted } = getToolStatus(part, chatStatus);
  const input = getPartInput(part);
  const description: string = input.description || '';
  const [expanded, setExpanded] = useState(defaultOpen ?? false);
  const [visibleCount, setVisibleCount] = useState(0);
  const visibleCountRef = useRef(0);
  const hasNestedTools = nestedTools.length > 0;
  const streamKey = part.toolCallId ?? (part.id as string) ?? '';
  const streamKeyRef = useRef(streamKey);
  const elapsedTimeDisplay = useElapsed(part, isPending);
  const maskThreshold = 4;
  const streamHeight = Math.max(1, maxVisibleTools) * 28;
  const visibleToolCount = isPending ? Math.max(visibleCount, 0) : nestedTools.length;
  const wasPendingRef = useRef(isPending);
  const userToggledRef = useRef(false);
  const openTimerRef = useRef<number | null>(null);
  const { fileCount, searchCount } = useMemo(() => {
    const visibleTools = isPending ? nestedTools.slice(0, Math.max(visibleCount, 0)) : nestedTools;
    return getNestedCounts(visibleTools);
  }, [isPending, nestedTools, visibleCount]);
  const streamCounts = formatStreamCounts(fileCount, searchCount);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const wasPending = wasPendingRef.current;
    if (openTimerRef.current) {
      window.clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
    if (isPending && !wasPending) {
      if (!userToggledRef.current && defaultOpen !== false) {
        setExpanded(false);
        openTimerRef.current = window.setTimeout(() => {
          setExpanded(true);
        }, 60);
      }
    }
    if (!isPending && wasPending) {
      setExpanded(false);
      userToggledRef.current = false;
    }
    wasPendingRef.current = isPending;
    return () => {
      if (openTimerRef.current) {
        window.clearTimeout(openTimerRef.current);
        openTimerRef.current = null;
      }
    };
  }, [defaultOpen, isPending]);

  useEffect(() => {
    const total = nestedTools.length;
    const updateVisibleCount = (value: number) => {
      visibleCountRef.current = value;
      setVisibleCount(value);
    };
    const keyChanged = streamKeyRef.current !== streamKey;
    streamKeyRef.current = streamKey;

    if (!isPending || total === 0) {
      updateVisibleCount(total);
      return;
    }
    let index = keyChanged ? 1 : Math.min(Math.max(visibleCountRef.current, 1), total);
    updateVisibleCount(index);
    if (index >= total) {
      return;
    }
    const interval = setInterval(() => {
      index += 1;
      updateVisibleCount(Math.min(index, total));
      if (index >= total) {
        clearInterval(interval);
      }
    }, 450);
    return () => clearInterval(interval);
  }, [isPending, nestedTools.length, streamKey]);

  useEffect(() => {
    if (!isPending || !listRef.current) {
      return;
    }
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [isPending, visibleCount]);

  const subtitle = (() => {
    if (isPending && hasNestedTools) {
      return streamCounts;
    }
    if (!isPending && hasNestedTools) {
      const summary = summarizeNestedTools(nestedTools);
      if (summary) {
        return summary;
      }
    }
    if (!description) {
      return '';
    }
    return description.length > 60 ? `${description.slice(0, 57)}...` : description;
  })();

  if (isInterrupted && !part.output) {
    return (
      <ToolRowBase
        completeLabel={interruptedLabel}
        isAnimating={false}
        className={className}
        style={style}
      />
    );
  }

  const isStreamingList = isPending && expanded && visibleToolCount > maskThreshold;
  const visibleTools = isPending ? nestedTools.slice(0, Math.max(visibleCount, 0)) : nestedTools;

  return (
    <ToolRowBase
      completeLabel={completeLabel}
      shimmerLabel={shimmerLabel}
      isAnimating={isPending}
      detail={subtitle}
      expandable={hasNestedTools}
      expanded={expanded}
      onToggleExpand={() => {
        userToggledRef.current = true;
        setExpanded((prev) => !prev);
      }}
      trailingContent={
        showElapsed && elapsedTimeDisplay ? (
          <span className={classes.elapsed}>{elapsedTimeDisplay}</span>
        ) : undefined
      }
      className={className}
      style={style}
    >
      <div className={classes.body}>
        {isStreamingList && <div className={classes.mask} />}
        <div
          ref={listRef}
          className={classes.list}
          data-multi={nestedTools.length > 1 || undefined}
          data-stream={isStreamingList || undefined}
          style={isStreamingList ? { height: streamHeight } : undefined}
        >
          {visibleTools.map((nestedPart, idx) => {
            const derivedPart: ToolPart = isPending
              ? {
                  ...nestedPart,
                  state: idx === visibleCount - 1 ? 'input-streaming' : 'output-available',
                }
              : nestedPart;
            const nestedMeta = toolRegistry[derivedPart.type];
            if (!nestedMeta) {
              return null;
            }
            const { isPending: nestedIsPending, isError: nestedIsError } = getToolStatus(
              derivedPart,
              chatStatus
            );
            return (
              <GenericTool
                key={idx}
                icon={nestedMeta.icon}
                title={nestedMeta.title(derivedPart)}
                subtitle={nestedMeta.subtitle?.(derivedPart)}
                isPending={nestedIsPending}
                isError={nestedIsError}
              />
            );
          })}
        </div>
      </div>
    </ToolRowBase>
  );
});
