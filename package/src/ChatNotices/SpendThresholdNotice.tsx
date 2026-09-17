import React, { memo } from 'react';
import { fillTemplate } from '../utils/fill-template';
import { formatSpend } from './chat-notices';
import { NoticeBar } from './NoticeBar';

export interface SpendThresholdNoticeAction {
  /** Button label */
  label: string;
  /** Called when the button is clicked */
  onClick: () => void;
  /** `primary` is filled, `secondary` is a text button, `secondary` by default */
  kind?: 'primary' | 'secondary';
}

export interface SpendThresholdNoticeLabels {
  /** `{amount}` is replaced with the formatted spend */
  title: string;
  /** Shown when `limit` is set, `{limit}` is replaced */
  limit: string;
  /** Accessible label of the close button */
  close: string;
}

export interface SpendThresholdNoticeProps {
  /** Money spent in this session */
  amount: number;
  /** ISO 4217 currency code, `USD` by default */
  currency?: string;
  /** BCP 47 locale used to format money, `en` by default */
  locale?: string;
  /** Spending limit, shown in the description when set */
  limit?: number;
  /** Extra explanation after the title */
  description?: React.ReactNode;
  /** Buttons, for example View usage or Set a limit */
  actions?: SpendThresholdNoticeAction[];
  /** Renders a close button when set */
  onDismiss?: () => void;
  /** Overrides for the English labels */
  labels?: Partial<SpendThresholdNoticeLabels>;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

const DEFAULT_LABELS: SpendThresholdNoticeLabels = {
  title: 'Session cost is now {amount}.',
  limit: 'Your limit is {limit}.',
  close: 'Dismiss',
};

/** Tells the user that the session spend passed a threshold */
export const SpendThresholdNotice = memo(function SpendThresholdNotice({
  amount,
  currency = 'USD',
  locale = 'en',
  limit,
  description,
  actions = [],
  onDismiss,
  labels: labelsProp,
  className,
  style,
}: SpendThresholdNoticeProps) {
  const labels = { ...DEFAULT_LABELS, ...labelsProp };
  const limitText =
    limit === undefined
      ? null
      : fillTemplate(labels.limit, { limit: formatSpend(limit, currency, locale) });
  const details = [limitText, description].filter(Boolean);

  return (
    <NoticeBar
      title={fillTemplate(labels.title, { amount: formatSpend(amount, currency, locale) })}
      description={
        details.length > 0 ? (
          <>
            {details.map((detail, index) => (
              <React.Fragment key={index}>
                {index > 0 && ' '}
                {detail}
              </React.Fragment>
            ))}
          </>
        ) : undefined
      }
      actions={actions}
      onClose={onDismiss}
      closeLabel={labels.close}
      className={className}
      style={style}
    />
  );
});

SpendThresholdNotice.displayName = 'SpendThresholdNotice';
