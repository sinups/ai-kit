import React, { memo } from 'react';
import { ScrollArea } from '@mantine/core';
import { useAnimationTime } from '../hooks/use-animation-clock';
import { useToolComplete } from '../hooks/use-tool-complete';
import { useChatLabels } from '../labels/chat-labels';
import { Markdown } from '../Markdown/Markdown';
import { ToolRowBase } from '../ToolRowBase/ToolRowBase';
import type { ToolPart } from '../types';
import type { StepState, ToolCallStep } from '../types/timeline';
import { formatElapsedTime } from '../utils/format-elapsed';
import { useFirstSeen } from './tool-presentation';
import { ToolActivity } from './ToolActivity';
import { noopComplete, useToolStep } from './use-tool-step';
import classes from './ThinkingTool.module.css';

export interface ThinkingToolLabels {
  /** Row while the model thinks, `Thinking` by default */
  thinking: string;
  /** Row once the thought is complete, gets the duration or an empty string, `Thought for 4s` by default */
  thought: (duration: string) => string;
}

export const DEFAULT_THINKING_TOOL_LABELS: ThinkingToolLabels = {
  thinking: 'Thinking',
  thought: (duration) => (duration ? `Thought for ${duration}` : 'Thought'),
};

export interface ThinkingCollapsedProps {
  /** Timeline step describing the tool call */
  step: ToolCallStep;
  /** Animation state of the step, the card shows shimmer while `animating` */
  state: StepState;
  /** Called once `step.duration` elapses while animating */
  onComplete: () => void;
  /** How long the thought took, formatted; the finished row names it when set */
  duration?: string;
  /** How long the model has been thinking, formatted; shown at the end of the row while it thinks */
  elapsed?: string;
  /** Initial expanded state in uncontrolled mode */
  defaultOpen?: boolean;
  /** Controlled expanded state */
  expanded?: boolean;
  /** Called when the row is toggled */
  onToggleExpand?: () => void;
  /** Overrides of the default English labels */
  labels?: Partial<ThinkingToolLabels>;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

/** "Thinking" / "Thought" row that expands to reveal the reasoning text */
export function ThinkingCollapsed({
  step,
  state,
  onComplete,
  duration = '',
  elapsed,
  defaultOpen,
  expanded,
  onToggleExpand,
  labels: labelsProp,
  className,
  style,
}: ThinkingCollapsedProps) {
  useToolComplete(state === 'animating', step.duration, onComplete);
  const labels = {
    ...DEFAULT_THINKING_TOOL_LABELS,
    ...useChatLabels('thinkingTool'),
    ...labelsProp,
  };

  return (
    <ToolRowBase
      shimmerLabel={labels.thinking}
      completeLabel={labels.thought(duration)}
      isAnimating={state === 'animating'}
      trailingContent={elapsed ? <ToolActivity elapsed={elapsed} /> : undefined}
      expandable={!!step.thoughtContent}
      defaultOpen={defaultOpen}
      expanded={expanded}
      onToggleExpand={onToggleExpand}
      className={className}
      style={style}
    >
      <ScrollArea.Autosize mah={175} type="auto" className={classes.scroll}>
        <Markdown content={step.thoughtContent ?? ''} className={classes.text} />
      </ScrollArea.Autosize>
    </ToolRowBase>
  );
}

export interface ThinkingToolProps {
  /** Tool part in AI SDK v5 shape, `input.thought` or string output is the reasoning text */
  part?: ToolPart;
  /** Timeline step, used together with `state` and `onComplete` instead of `part` */
  step?: ToolCallStep;
  /** Animation state of the step */
  state?: StepState;
  /** Called once `step.duration` elapses while animating */
  onComplete?: () => void;
  /** Initial expanded state in uncontrolled mode */
  defaultOpen?: boolean;
  /** Controlled expanded state */
  expanded?: boolean;
  /** Called when the row is toggled */
  onToggleExpand?: () => void;
  /** Overrides of the default English labels */
  labels?: Partial<ThinkingToolLabels>;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

/**
 * Accepts either a `tool-Thinking` part or an explicit timeline step. A part is timed from its first
 * render to the moment it completes, so the finished row reads `Thought for 4s`.
 */
export const ThinkingTool = memo(function ThinkingTool({
  part,
  step: externalStep,
  state: externalState,
  onComplete: externalOnComplete,
  defaultOpen,
  expanded,
  onToggleExpand,
  labels,
  className,
  style,
}: ThinkingToolProps) {
  const fromPart = useToolStep(
    externalStep && externalState && externalOnComplete ? undefined : part,
    'Thinking',
    'thinking'
  );
  const isThinking = fromPart?.stepState === 'animating';
  const firstSeen = useFirstSeen();
  const callId = part?.toolCallId;
  const startedAt = firstSeen(callId);
  const finishedAt = isThinking || !fromPart ? undefined : firstSeen(callId, ':done');
  const now = useAnimationTime({
    intervalMs: 1000,
    active: isThinking,
    respectReducedMotion: false,
  });
  const units = useChatLabels('durationUnits');

  const external = externalStep && externalState && externalOnComplete;
  if (!external && !fromPart) {
    return null;
  }

  return (
    <ThinkingCollapsed
      step={external ? externalStep : fromPart!.step}
      state={external ? externalState : fromPart!.stepState}
      onComplete={external ? externalOnComplete : noopComplete}
      elapsed={isThinking ? formatElapsedTime(now - startedAt, units) : undefined}
      duration={
        external || finishedAt === undefined
          ? undefined
          : formatElapsedTime(finishedAt - startedAt, units)
      }
      defaultOpen={defaultOpen}
      expanded={expanded}
      onToggleExpand={onToggleExpand}
      labels={labels}
      className={className}
      style={style}
    />
  );
});

ThinkingTool.displayName = 'ThinkingTool';
