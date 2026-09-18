import React, { memo } from 'react';
import { fillTemplate } from '../utils/fill-template';
import { NoticeBar, type NoticeBarAction } from './NoticeBar';

export interface ToolUnavailableNoticeLabels {
  /** Shown when `server` is set, `{server}` is replaced */
  title: string;
  /** Shown when `server` is not set */
  titleWithoutServer: string;
  /** Retry button */
  retry: string;
  /** Accessible label of the close button */
  close: string;
}

export const DEFAULT_TOOL_UNAVAILABLE_NOTICE_LABELS: ToolUnavailableNoticeLabels = {
  title: '{server} is unavailable.',
  titleWithoutServer: 'A tool is unavailable.',
  retry: 'Try again',
  close: 'Dismiss',
};

export interface ToolUnavailableNoticeProps {
  /** What went wrong, for example `Connection to the server was lost after 3 attempts.` */
  message: React.ReactNode;
  /** Name of the server or tool that went away, shown in the title */
  server?: string;
  /** Renders a retry button when set */
  onRetry?: () => void;
  /** Renders a close button when set */
  onDismiss?: () => void;
  /** Overrides of the default English labels */
  labels?: Partial<ToolUnavailableNoticeLabels>;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

/** Tells the user in the transcript that a tool or its server stopped answering */
export const ToolUnavailableNotice = memo(function ToolUnavailableNotice({
  message,
  server,
  onRetry,
  onDismiss,
  labels: labelsProp,
  className,
  style,
}: ToolUnavailableNoticeProps) {
  const labels = { ...DEFAULT_TOOL_UNAVAILABLE_NOTICE_LABELS, ...labelsProp };
  const title = server ? fillTemplate(labels.title, { server }) : labels.titleWithoutServer;
  const actions: NoticeBarAction[] = onRetry ? [{ label: labels.retry, onClick: onRetry }] : [];

  return (
    <NoticeBar
      title={title}
      description={message}
      actions={actions}
      onClose={onDismiss}
      labels={{ close: labels.close }}
      className={className}
      style={style}
    />
  );
});

ToolUnavailableNotice.displayName = 'ToolUnavailableNotice';
