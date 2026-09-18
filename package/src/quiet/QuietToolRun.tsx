import React, { useRef, useState } from 'react';
import { resolveToolCallState, useToolApprovals } from '../approvals/approval-context';
import { useAnimationTime } from '../hooks/use-animation-clock';
import { useChatLabels } from '../labels/chat-labels';
import { capitalize, DEFAULT_TOOL_RUN_LABELS, type ToolRunLabels } from '../MessageList/tool-runs';
import { SpiralLoader } from '../SpiralLoader/SpiralLoader';
import { ToolRowBase } from '../ToolRowBase/ToolRowBase';
import { DEFAULT_THINKING_TOOL_LABELS } from '../tools/ThinkingTool';
import { ToolActivity } from '../tools/ToolActivity';
import {
  findToolCatalogEntry,
  getToolCatalogTitle,
  useFirstSeen,
  useToolPresentation,
} from '../tools/tool-presentation';
import type { ToolPart } from '../types';
import { cx } from '../utils/cx';
import { formatElapsedTime } from '../utils/format-elapsed';
import { QuietToolRow, readTitle, type QuietToolRowProps } from './QuietToolRow';
import classes from './Quiet.module.css';

export interface QuietToolRunProps extends Omit<QuietToolRowProps, 'part'> {
  /** Steps of one turn in a row — thinking and finished or running calls — folded into one line */
  parts: ToolPart[];
  /** Phrases of the folded line: `thought`, `otherTools`, `working` while nothing runs yet */
  labels?: Partial<ToolRunLabels>;
  /** The line ends the streaming answer, so it stays alive between steps */
  isTail?: boolean;
  /** Moment the turn began; the line counts from it, as the working row before it did */
  turnStartedAt?: number;
}

function isThinking(part: ToolPart): boolean {
  return part.type === 'tool-Thinking';
}

/**
 * The activity of a turn before its answer as one quiet line: `Thought · used 2 tools · 26s`. While
 * a step still runs the line shimmers with that step and the time so far; the steps open in order.
 * A call that waits for a decision stays outside the line with its buttons.
 */
export function QuietToolRun({
  parts,
  labels: labelsProp,
  isTail = false,
  turnStartedAt,
  ...rowProps
}: QuietToolRunProps) {
  const { chatStatus, lookups, className, style } = rowProps;
  const labels = { ...DEFAULT_TOOL_RUN_LABELS, ...labelsProp };
  const thinkingLabels = { ...DEFAULT_THINKING_TOOL_LABELS, ...useChatLabels('thinkingTool') };
  const units = useChatLabels('durationUnits');
  const presentation = useToolPresentation();
  const approvals = useToolApprovals();

  const firstSeen = useFirstSeen();
  const isWaiting = (part: ToolPart) => {
    const request = approvals?.[part.toolCallId ?? ''];
    return Boolean(request && !request.outcome);
  };
  const steps = parts.filter((part) => !isWaiting(part));
  const waiting = parts.filter(isWaiting);

  const running = steps.filter((part) =>
    isThinking(part)
      ? part.state === 'input-streaming'
      : resolveToolCallState(part, approvals?.[part.toolCallId ?? ''], { chatStatus, lookups }) ===
        'running'
  );
  const isLive = running.length > 0 || (isTail && waiting.length === 0);
  for (const part of steps) {
    if (isThinking(part) && part.state !== 'input-streaming') {
      firstSeen(part.toolCallId, ':done');
    }
  }
  const firstStepAt =
    steps.length > 0 ? Math.min(...steps.map((part) => firstSeen(part.toolCallId))) : Date.now();
  const startedAt = useRef(turnStartedAt ?? firstStepAt).current;
  const finishedAt = useRef<number | undefined>(undefined);
  const [expanded, setExpanded] = useState(false);
  const [opened, setOpened] = useState(false);
  if (isLive) {
    finishedAt.current = undefined;
  } else if (finishedAt.current === undefined) {
    finishedAt.current = Date.now();
  }
  const now = useAnimationTime({ intervalMs: 1000, active: isLive, respectReducedMotion: false });
  const time = formatElapsedTime((isLive ? now : (finishedAt.current ?? now)) - startedAt, units);

  if (steps.length === 0) {
    return (
      <>
        {parts.map((part, index) => (
          <QuietToolRow key={part.toolCallId ?? index} part={part} {...rowProps} />
        ))}
      </>
    );
  }

  const current = running[running.length - 1];
  const currentLabel = current
    ? isThinking(current)
      ? thinkingLabels.thinking
      : `${readTitle(current, getToolCatalogTitle(findToolCatalogEntry(presentation.catalog, current)))}…`
    : labels.working;
  const thoughts = steps.filter(isThinking).length;
  const calls = steps.length - thoughts;
  const summary = [thoughts > 0 && labels.thought, calls > 0 && labels.otherTools(calls), time]
    .filter((phrase): phrase is string => Boolean(phrase))
    .join(' · ');

  return (
    <>
      <ToolRowBase
        icon={isLive ? <SpiralLoader size={12} data-activity-loader /> : undefined}
        completeLabel={capitalize(summary)}
        shimmerLabel={currentLabel}
        isAnimating={isLive}
        trailingContent={isLive && time ? <ToolActivity elapsed={time} /> : undefined}
        expandable
        expanded={expanded}
        onToggleExpand={() => {
          setOpened(true);
          setExpanded((open) => !open);
        }}
        className={cx(classes.quiet, className)}
        style={style}
        data-tool-run
      >
        {opened && (
          <div className={classes.run}>
            {steps.map((part, index) => (
              <QuietToolRow key={part.toolCallId ?? index} part={part} {...rowProps} />
            ))}
          </div>
        )}
      </ToolRowBase>
      {waiting.length > 0 && (
        <div className={classes.waiting}>
          {waiting.map((part, index) => (
            <QuietToolRow key={part.toolCallId ?? index} part={part} {...rowProps} />
          ))}
        </div>
      )}
    </>
  );
}

QuietToolRun.displayName = 'QuietToolRun';
