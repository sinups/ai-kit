import React, { memo } from 'react';
import { useToolComplete } from '../hooks/use-tool-complete';
import { ToolRowBase } from '../ToolRowBase/ToolRowBase';
import type { StepState, ToolCallStep } from '../types/timeline';
import classes from './GenericTool.module.css';

export interface GenericToolRowProps {
  /** Timeline step describing the tool call */
  step: ToolCallStep;
  /** Animation state of the step, the card shows shimmer while `animating` */
  state: StepState;
  /** Called once `step.duration` elapses while animating */
  onComplete: () => void;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

/** Timeline-driven generic row: tool name with shimmer while animating */
export function GenericToolRow({ step, state, onComplete, className, style }: GenericToolRowProps) {
  useToolComplete(state === 'animating', step.duration, onComplete);
  const isPending = state === 'animating';

  return (
    <ToolRowBase
      shimmerLabel={step.toolName}
      completeLabel={step.toolName}
      isAnimating={isPending}
      detail={step.toolDetail}
      className={className}
      style={style}
    />
  );
}

export interface GenericToolProps {
  /** Icon component rendered in the 12x12 slot before the title */
  icon?: React.ComponentType<{ className?: string }>;
  /** Row label, shown with shimmer while `isPending` */
  title: string;
  /** Muted, truncated text after the title */
  subtitle?: string;
  /** Whether the tool is still running */
  isPending: boolean;
  /** Whether the tool failed, reserved for future styling */
  isError?: boolean;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

/** Single-line tool row driven by registry metadata (title/subtitle/icon) */
export const GenericTool = memo(function GenericTool({
  icon,
  title,
  subtitle,
  isPending,
  className,
  style,
}: GenericToolProps) {
  const Icon = icon;

  return (
    <ToolRowBase
      icon={Icon ? <Icon className={classes.icon} /> : undefined}
      shimmerLabel={title}
      completeLabel={title}
      isAnimating={isPending}
      detail={subtitle}
      className={className}
      style={style}
    />
  );
});
