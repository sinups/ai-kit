import React, { memo, useMemo, useState } from 'react';
import { Box, Button, VisuallyHidden } from '@mantine/core';
import { useCountdown } from '../hooks/use-countdown';
import { cx } from '../utils/cx';
import { truncateErrorMessage } from './error-message';
import classes from './ErrorMessage.module.css';

export type ErrorMessageRetry = {
  /** Current retry attempt, 1-based */
  attempt: number;
  /** Total attempts the client will make */
  maxAttempts?: number;
  /** When the next attempt starts, as a timestamp in ms or a `Date` */
  retryAt: number | Date;
};

export type ErrorMessageProps = {
  /** Card title, `Something went wrong` by default */
  title?: string;
  /** Error details shown under the title */
  message: string;
  /** Visual tone: `error` for failures, `warning` for rate limits and transient problems */
  variant?: 'error' | 'warning';
  /** Automatic retry schedule, renders a live countdown */
  retry?: ErrorMessageRetry;
  /** When a usage limit resets; rendered as a local time */
  resetsAt?: number | Date;
  /** Collapses a message longer than 6 lines or 600 characters behind "Show more", off by default */
  collapsible?: boolean;
  /** Renders a retry button */
  onRetry?: () => void;
  /** Retry button label, `Retry` by default */
  retryLabel?: string;
  /** Countdown text of an automatic retry, `secondsLeft` is `0` once the attempt has started */
  retryingLabel?: (secondsLeft: number, retry: ErrorMessageRetry) => string;
  /** Reset time text, receives the formatted local time */
  resetsAtLabel?: (time: string) => string;
  /** "Show more" label of a long collapsed message, `Show more` by default */
  showMoreLabel?: string;
  /** "Show less" label of an expanded long message, `Show less` by default */
  showLessLabel?: string;
  /** Class name added to the root element */
  className?: string;
};

function formatRetrying(secondsLeft: number, retry: ErrorMessageRetry): string {
  const attempt = retry.maxAttempts
    ? `${retry.attempt} of ${retry.maxAttempts}`
    : `${retry.attempt}`;
  return secondsLeft > 0 ? `Next try in ${secondsLeft}s · ${attempt}` : `Trying again · ${attempt}`;
}

function formatResetsAt(time: string): string {
  return `Available again at ${time}`;
}

/** Inline error card rendered in place of an assistant reply */
export const ErrorMessage = memo(function ErrorMessage({
  title = 'Something went wrong',
  message,
  variant = 'error',
  retry,
  resetsAt,
  collapsible = false,
  onRetry,
  retryLabel = 'Retry',
  retryingLabel = formatRetrying,
  resetsAtLabel = formatResetsAt,
  showMoreLabel = 'Show more',
  showLessLabel = 'Show less',
  className,
}: ErrorMessageProps) {
  const secondsLeft = useCountdown(retry?.retryAt);
  const [expanded, setExpanded] = useState(false);
  const shortened = useMemo(
    () => (collapsible ? truncateErrorMessage(message) : { text: message, truncated: false }),
    [collapsible, message]
  );

  const resetsAtText = useMemo(() => {
    if (resetsAt === undefined) {
      return null;
    }
    const time = new Intl.DateTimeFormat(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    }).format(resetsAt instanceof Date ? resetsAt : new Date(resetsAt));
    return resetsAtLabel(time);
  }, [resetsAt, resetsAtLabel]);

  const hasFooter = Boolean(retry || resetsAtText || onRetry);

  return (
    <Box className={cx(classes.root, className)}>
      <div className={classes.card} data-variant={variant}>
        <div className={classes.title}>{title}</div>
        <div className={classes.message} data-collapsible={collapsible || undefined}>
          {shortened.truncated && !expanded ? shortened.text : message}
        </div>
        {shortened.truncated && (
          <Button
            variant="subtle"
            color="gray"
            size="compact-xs"
            className={classes.toggle}
            aria-expanded={expanded}
            onClick={() => setExpanded((value) => !value)}
          >
            {expanded ? showLessLabel : showMoreLabel}
          </Button>
        )}
        {hasFooter && (
          <div className={classes.footer}>
            <div className={classes.meta}>
              {retry && secondsLeft !== undefined && (
                <span>{retryingLabel(secondsLeft, retry)}</span>
              )}
              {retry && (
                <VisuallyHidden aria-live="polite">
                  {secondsLeft !== undefined && secondsLeft <= 0 ? retryingLabel(0, retry) : ''}
                </VisuallyHidden>
              )}
              {resetsAtText && <span>{resetsAtText}</span>}
            </div>
            {onRetry && (
              <Button size="compact-xs" variant="default" onClick={onRetry}>
                {retryLabel}
              </Button>
            )}
          </div>
        )}
      </div>
    </Box>
  );
});

ErrorMessage.displayName = 'ErrorMessage';
