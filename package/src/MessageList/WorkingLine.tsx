import React from 'react';
import { useAnimationTime } from '../hooks/use-animation-clock';
import { useChatLabels } from '../labels/chat-labels';
import { SpiralLoader } from '../SpiralLoader/SpiralLoader';
import { ToolRowBase } from '../ToolRowBase/ToolRowBase';
import { ToolActivity } from '../tools/ToolActivity';
import { formatElapsedTime } from '../utils/format-elapsed';

export interface WorkingLineProps {
  /** Verb of the line, for example `Working` */
  label: string;
  /** Moment the time is counted from */
  since: number;
  /** Class name added to the root element */
  className?: string;
}

/** Quiet line at the end of the transcript while the agent works, in the form of the planning row */
export function WorkingLine({ label, since, className }: WorkingLineProps) {
  const now = useAnimationTime({ intervalMs: 1000, respectReducedMotion: false });
  const units = useChatLabels('durationUnits');
  const elapsed = formatElapsedTime(Math.max(0, now - since), units);

  return (
    <ToolRowBase
      icon={<SpiralLoader size={12} data-activity-loader />}
      shimmerLabel={label}
      completeLabel={label}
      isAnimating
      trailingContent={
        elapsed ? (
          <span aria-hidden>
            <ToolActivity elapsed={elapsed} />
          </span>
        ) : undefined
      }
      className={className}
      role="status"
      aria-live="polite"
      data-working-row
    />
  );
}

WorkingLine.displayName = 'WorkingLine';
