import React, { memo } from 'react';
import { ScrollArea } from '@mantine/core';
import { useToolComplete } from '../hooks/use-tool-complete';
import { ToolRowBase } from '../ToolRowBase/ToolRowBase';
import type { ToolPart } from '../types';
import type { StepState, ToolCallStep } from '../types/timeline';
import { noopComplete, useToolStep } from './use-tool-step';
import classes from './ThinkingTool.module.css';

export interface ThinkingCollapsedProps {
  /** Timeline step describing the tool call */
  step: ToolCallStep;
  /** Animation state of the step, the card shows shimmer while `animating` */
  state: StepState;
  /** Called once `step.duration` elapses while animating */
  onComplete: () => void;
  /** Initial expanded state in uncontrolled mode */
  defaultOpen?: boolean;
  /** Controlled expanded state */
  expanded?: boolean;
  /** Called when the row is toggled */
  onToggleExpand?: () => void;
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
  defaultOpen,
  expanded,
  onToggleExpand,
  className,
  style,
}: ThinkingCollapsedProps) {
  useToolComplete(state === 'animating', step.duration, onComplete);

  return (
    <ToolRowBase
      shimmerLabel="Thinking"
      completeLabel="Thought"
      isAnimating={state === 'animating'}
      expandable={!!step.thoughtContent}
      defaultOpen={defaultOpen}
      expanded={expanded}
      onToggleExpand={onToggleExpand}
      className={className}
      style={style}
    >
      <ScrollArea.Autosize mah={175} type="auto">
        <p className={classes.text}>{step.thoughtContent}</p>
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
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

/** Accepts either a `tool-Thinking` part or an explicit timeline step */
export const ThinkingTool = memo(function ThinkingTool({
  part,
  step: externalStep,
  state: externalState,
  onComplete: externalOnComplete,
  defaultOpen,
  expanded,
  onToggleExpand,
  className,
  style,
}: ThinkingToolProps) {
  const hasExternalStep = Boolean(externalStep && externalState && externalOnComplete);
  const fromPart = useToolStep(hasExternalStep ? undefined : part, 'Thinking', 'thinking');

  let step: ToolCallStep;
  let stepState: StepState;
  let onComplete: () => void;

  if (externalStep && externalState && externalOnComplete) {
    step = externalStep;
    stepState = externalState;
    onComplete = externalOnComplete;
  } else if (fromPart) {
    step = fromPart.step;
    stepState = fromPart.stepState;
    onComplete = noopComplete;
  } else {
    return null;
  }

  return (
    <ThinkingCollapsed
      step={step}
      state={stepState}
      onComplete={onComplete}
      defaultOpen={defaultOpen}
      expanded={expanded}
      onToggleExpand={onToggleExpand}
      className={className}
      style={style}
    />
  );
});
