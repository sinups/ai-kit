import React, { memo } from 'react';
import { fillTemplate } from '../utils/fill-template';
import { formatTokens } from '../utils/format-tokens';
import { formatAwayDuration } from './chat-notices';
import { NoticeBar, type NoticeBarAction } from './NoticeBar';

export interface IdleReturnPromptLabels {
  /** `{duration}` is replaced, for example `3h` */
  title: string;
  /** Shown when `tokens` is set, `{tokens}` is replaced, for example `180k` */
  message: string;
  /** Shown when `tokens` is not set */
  messageWithoutTokens: string;
  continue: string;
  newChat: string;
  dontAskAgain: string;
}

export interface IdleReturnPromptProps {
  /** How long the user was away, in milliseconds */
  awayMs: number;
  /** Size of the conversation in tokens */
  tokens?: number;
  /** Keeps working in this conversation */
  onContinue: () => void;
  /** Starts a new chat carrying over the drafted message, the button is rendered only when set */
  onNewChat?: () => void;
  /** Turns the prompt off, the button is rendered only when set */
  onDontAskAgain?: () => void;
  /** Overrides for the English labels */
  labels?: Partial<IdleReturnPromptLabels>;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

const DEFAULT_LABELS: IdleReturnPromptLabels = {
  title: 'Welcome back, {duration} since your last message.',
  message: 'This chat already holds {tokens} tokens. Keep going here or start fresh?',
  messageWithoutTokens: 'Keep going here or start fresh?',
  continue: 'Continue',
  newChat: 'New chat with this message',
  dontAskAgain: 'Stop asking',
};

/** Asks a returning user whether to keep a long conversation or start fresh */
export const IdleReturnPrompt = memo(function IdleReturnPrompt({
  awayMs,
  tokens,
  onContinue,
  onNewChat,
  onDontAskAgain,
  labels: labelsProp,
  className,
  style,
}: IdleReturnPromptProps) {
  const labels = { ...DEFAULT_LABELS, ...labelsProp };
  const message =
    tokens === undefined
      ? labels.messageWithoutTokens
      : fillTemplate(labels.message, { tokens: formatTokens(tokens) });

  const actions: NoticeBarAction[] = [
    { label: labels.continue, onClick: onContinue, kind: 'primary' },
  ];
  if (onNewChat) {
    actions.push({ label: labels.newChat, onClick: onNewChat });
  }
  if (onDontAskAgain) {
    actions.push({ label: labels.dontAskAgain, onClick: onDontAskAgain, kind: 'muted' });
  }

  return (
    <NoticeBar
      title={fillTemplate(labels.title, { duration: formatAwayDuration(awayMs) })}
      description={message}
      actions={actions}
      className={className}
      style={style}
    />
  );
});

IdleReturnPrompt.displayName = 'IdleReturnPrompt';
