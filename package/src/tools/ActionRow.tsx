import React from 'react';
import { useToolComplete } from '../hooks/use-tool-complete';
import { ToolRowBase } from '../ToolRowBase/ToolRowBase';
import type { StepState, ToolCallStep } from '../types/timeline';

const ACTION_LABELS = ['Brewing...', 'Crafting...', 'Processing...', 'Preparing...'];

export interface ActionRowProps {
  /** Timeline step describing the tool call */
  step: ToolCallStep;
  /** Animation state of the step, the card shows shimmer while `animating` */
  state: StepState;
  /** Called once `step.duration` elapses while animating */
  onComplete: () => void;
  /** Index of the action in the timeline, selects the shimmer label */
  index: number;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

/** Generic action row with a rotating "Brewing..." style shimmer label */
export function ActionRow({ step, state, onComplete, index, className, style }: ActionRowProps) {
  useToolComplete(state === 'animating', step.duration, onComplete);
  const isAnimating = state === 'animating';
  const label = ACTION_LABELS[index % ACTION_LABELS.length]!;

  return (
    <ToolRowBase
      shimmerLabel={label}
      completeLabel={step.toolName}
      isAnimating={isAnimating}
      className={className}
      style={style}
    />
  );
}
