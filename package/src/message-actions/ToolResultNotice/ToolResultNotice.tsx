import React, { memo } from 'react';
import { Code, Stack, Text } from '@mantine/core';
import {
  IconAlertTriangle,
  IconHandStop,
  IconPlayerStop,
  IconPlugOff,
  type Icon,
} from '@tabler/icons-react';
import { ToolRowBase } from '../../ToolRowBase/ToolRowBase';
import type { ToolResultNoticeVariant } from '../types';
import classes from './ToolResultNotice.module.css';

export interface ToolResultNoticeLabels {
  rejected: string;
  cancelled: string;
  error: string;
  interrupted: string;
  feedback: string;
}

const DEFAULT_LABELS: ToolResultNoticeLabels = {
  rejected: 'Rejected',
  cancelled: 'Cancelled',
  error: 'Failed',
  interrupted: 'Interrupted',
  feedback: 'Your feedback',
};

const VARIANT_ICON: Record<ToolResultNoticeVariant, { icon: Icon; color?: string }> = {
  rejected: { icon: IconHandStop, color: 'var(--ae-warning)' },
  cancelled: { icon: IconPlayerStop },
  error: { icon: IconAlertTriangle, color: 'var(--ae-danger)' },
  interrupted: { icon: IconPlugOff },
};

export interface ToolResultNoticeProps {
  /** Why the tool call did not complete */
  variant: ToolResultNoticeVariant;
  /** Tool name, for example `Edit` or `git_search` */
  toolName: string;
  /** Short subject of the call shown after the tool name, for example a file path */
  detail?: string;
  /** What the user told the agent when rejecting the call, quoted in the expanded row */
  feedback?: string;
  /** Error output of a failed call, shown as code in the expanded row */
  errorText?: string;
  /** Extra explanation shown in the expanded row, for example why the call was interrupted */
  reason?: React.ReactNode;
  /** Initial expanded state, `false` by default */
  defaultExpanded?: boolean;
  /** Overrides of the default English labels */
  labels?: Partial<ToolResultNoticeLabels>;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

/** Compact trace of a rejected, cancelled, failed or interrupted tool call, expandable to its feedback or error */
export const ToolResultNotice = memo(function ToolResultNotice({
  variant,
  toolName,
  detail,
  feedback,
  errorText,
  reason,
  defaultExpanded = false,
  labels: labelsProp,
  className,
  style,
}: ToolResultNoticeProps) {
  const labels = { ...DEFAULT_LABELS, ...labelsProp };
  const { icon: VariantIcon, color } = VARIANT_ICON[variant];
  const feedbackText = variant === 'rejected' ? feedback?.trim() : undefined;
  const errorOutput = variant === 'error' ? errorText?.trim() : undefined;
  const expandable = Boolean(feedbackText || errorOutput || reason);

  return (
    <ToolRowBase
      icon={<VariantIcon size={12} color={color} aria-hidden />}
      completeLabel={labels[variant]}
      detail={detail ? `${toolName} ${detail}` : toolName}
      isAnimating={false}
      expandable={expandable}
      defaultOpen={defaultExpanded}
      className={className}
      style={style}
      data-variant={variant}
    >
      <Stack gap="xs" className={classes.details}>
        {reason && (
          <Text size="xs" c="dimmed">
            {reason}
          </Text>
        )}
        {feedbackText && (
          <Stack gap={2} className={classes.note}>
            <Text size="xs" c="dimmed">
              {labels.feedback}
            </Text>
            <Text size="sm" className={classes.quote}>
              {feedbackText}
            </Text>
          </Stack>
        )}
        {errorOutput && (
          <Code block className={classes.code}>
            {errorOutput}
          </Code>
        )}
      </Stack>
    </ToolRowBase>
  );
});

ToolResultNotice.displayName = 'ToolResultNotice';
